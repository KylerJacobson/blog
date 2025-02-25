package media

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/KylerJacobson/blog/backend/internal/authorization"
	media_repo "github.com/KylerJacobson/blog/backend/internal/db/media"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/internal/services/azure"
	"github.com/KylerJacobson/blog/backend/logger"
)

const (
	MaxFileSize        = 10 << 20 // 10 MB
	MaxTotalUploadSize = 50 << 20 // 50 MB
	MaxFilesPerRequest = 5        // Maximum number of files per upload
)

var AllowedFileTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"video/mp4":  true,
}

// FileTypeExtensions maps content types to file extensions
var FileTypeExtensions = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
	"video/mp4":  ".mp4",
}

type MediaApi interface {
	GetMediaByPostId(w http.ResponseWriter, r *http.Request)
	UploadMedia(w http.ResponseWriter, r *http.Request)
	DeleteMediaByPostId(w http.ResponseWriter, r *http.Request)
}

type mediaApi struct {
	mediaRepository media_repo.MediaRepository
	auth            *authorization.AuthService
	logger          logger.Logger
	azClient        *azure.AzureClient
}

func New(mediaRepo media_repo.MediaRepository, auth *authorization.AuthService, logger logger.Logger, client *azure.AzureClient) *mediaApi {
	return &mediaApi{
		mediaRepository: mediaRepo,
		auth:            auth,
		logger:          logger,
		azClient:        client,
	}
}

func (m *mediaApi) GetMediaByPostId(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	postId, err := strconv.Atoi(id)
	if err != nil {
		m.logger.Sugar().Errorf("GetPostId parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", ""))
		return
	}

	privilege := m.auth.CheckPrivilege(r)

	media, err := m.mediaRepository.GetMediaByPostId(postId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		b, _ := json.Marshal(err)
		w.Write(b)
		return
	}
	// TODO Add URL top postObject

	// TODO create object with post + urls
	type postMedia struct {
		Url         string `json:"url"`
		ContentType string `json:"contentType"`
		Name        string `json:"name"`
		PostId      int    `json:"postId"`
	}
	var postMediaSlc = []postMedia{}
	for _, attachment := range media {
		//Check auth status
		url, err := m.azClient.GetUrlForBlob(attachment.BlobName)
		if err != nil {
			m.logger.Sugar().Errorf("error getting URL for blob: %v", err)
			httperr.Write(w, httperr.Internal("internal server error", ""))
			return
		}
		postMediaSlc = append(postMediaSlc, postMedia{Url: url, ContentType: attachment.ContentType, Name: attachment.BlobName, PostId: attachment.PostId})
		if attachment.Restricted {
			if !privilege {
				httperr.Write(w, httperr.Forbidden("insufficient privileges", ""))
				return
			}
		}
	}
	b, err := json.Marshal(postMediaSlc)
	if err != nil {
		m.logger.Sugar().Errorf("error marshalling media post for post %d : %v", postId, err)
		httperr.Write(w, httperr.Internal("internal server error", ""))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (m *mediaApi) DeleteMediaByPostId(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	postId, err := strconv.Atoi(id)
	if err != nil {
		m.logger.Sugar().Errorf("GetPostId parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", ""))
		return
	}

	err = m.mediaRepository.DeleteMediaByPostId(postId)
	if err != nil {
		httperr.Write(w, httperr.Internal("internal server error", ""))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (m *mediaApi) UploadMedia(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, MaxFileSize)

	// Parse the multipart form data
	err := r.ParseMultipartForm(MaxTotalUploadSize)
	if err != nil {
		if errors.Is(err, http.ErrNotMultipart) {
			httperr.Write(w, httperr.BadRequest("Not a multipart request", "Use multipart/form-data encoding"))
			return
		}
		if strings.Contains(err.Error(), "request body too large") {
			httperr.Write(w, httperr.BadRequest("Request too large",
				fmt.Sprintf("Maximum upload size is %d MB", MaxTotalUploadSize/(1<<20))))
			return
		}
		m.logger.Sugar().Errorf("Error parsing form: %v", err)
		httperr.Write(w, httperr.Internal("Error processing upload", ""))
		return
	}

	// Retrieve the files from the "files" form field
	restrictedStr := r.Form.Get("restricted")
	postIdStr := r.Form.Get("postId")
	postId, err := strconv.Atoi(postIdStr)
	if err != nil {
		m.logger.Sugar().Errorf("postId parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", ""))
		return
	}
	restricted, err := strconv.ParseBool(restrictedStr)
	if err != nil {
		m.logger.Sugar().Errorf("restricted parameter was not a boolean: %v", err)
		httperr.Write(w, httperr.BadRequest("restricted must be a boolean", ""))
		return
	}

	files := r.MultipartForm.File["photos"]
	if files == nil {
		httperr.Write(w, httperr.BadRequest("no files found", ""))
		return
	}

	successfulUploads := 0
	failedUploads := 0
	for _, fileHeader := range files {
		fileType, err := getFileContentType(fileHeader)
		if err != nil {
			m.logger.Sugar().Errorf("error getting the mime type of the file: %v", err)
			httperr.Write(w, httperr.Internal("internal server error", ""))
			return
		}

		if !AllowedFileTypes[fileType] {
			m.logger.Sugar().Warnf("Invalid file type: %s for file %s", fileType, fileHeader.Filename)
			failedUploads++
			continue
		}

		safeFilename := sanitizeFilename(fileHeader.Filename)

		blobName := fmt.Sprintf("blog-media/%d_%s", postId, safeFilename)
		err = m.azClient.UploadFileToBlob(fileHeader, blobName)
		if err != nil {
			failedUploads++
			m.logger.Sugar().Errorf("Error uploading media: %v", err)
			httperr.Write(w, httperr.Internal("internal server error", ""))
			return
		}
		err = m.mediaRepository.UploadMedia(postId, blobName, fileType, restricted)
		if err != nil {
			// TODO delete the blob since the database entry failed
			m.logger.Sugar().Errorf("Error uploading media reference to database: %v", err)
			httperr.Write(w, httperr.Internal("internal server error", ""))
			continue
		}
		successfulUploads++
	}
	if successfulUploads == 0 && failedUploads > 0 {
		httperr.Write(w, httperr.BadRequest("All uploads failed", "Check logs for details"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if failedUploads > 0 {
		w.WriteHeader(http.StatusPartialContent)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":    "Some files were uploaded successfully",
			"successful": successfulUploads,
			"failed":     failedUploads,
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "All files uploaded successfully",
		"count":   successfulUploads,
	})
}

func getFileContentType(fileHeader *multipart.FileHeader) (string, error) {
	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer file.Close()

	// Read the first 512 bytes
	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return "", err
	}

	// Detect the content type
	contentType := http.DetectContentType(buf[:n])

	// Reset the file pointer to the beginning
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	return contentType, nil
}

func sanitizeFilename(filename string) string {
	filename = filepath.Base(filename)

	invalidChars := []string{"\\", "/", ":", "*", "?", "\"", "<", ">", "|"}
	for _, char := range invalidChars {
		filename = strings.ReplaceAll(filename, char, "_")
	}
	if len(filename) > 100 {
		ext := filepath.Ext(filename)
		filename = filename[:100-len(ext)] + ext
	}

	return filename
}
