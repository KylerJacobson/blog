package media

import (
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/KylerJacobson/blog/backend/internal/authorization"
	media_repo "github.com/KylerJacobson/blog/backend/internal/db/media"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/internal/services/azure"
	"github.com/KylerJacobson/blog/backend/logger"
)

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
	// Limit the size of the incoming request to 10 MB
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20) // 10 MB

	// Parse the multipart form data
	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		httperr.Write(w, httperr.BadRequest("file too large", ""))
		return
	}

	// Retrieve the files from the "files" form field
	restricted := r.Form.Get("restricted")
	postId := r.Form.Get("postId")
	iPostId, err := strconv.Atoi(postId)
	if err != nil {
		m.logger.Sugar().Errorf("postId parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", ""))
		return
	}
	bRestricted, err := strconv.ParseBool(restricted)
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
	for _, fileHeader := range files {
		// Process each file
		blobName := "blog-media/" + fileHeader.Filename
		err := m.azClient.UploadFileToBlob(fileHeader, blobName)
		if err != nil {
			m.logger.Sugar().Errorf("Error uploading media: %v", err)
			httperr.Write(w, httperr.Internal("internal server error", ""))
			return
		}
		fileType, err := getFileContentType(fileHeader)
		if err != nil {
			m.logger.Sugar().Errorf("error getting the mime type of the file: %v", err)
			httperr.Write(w, httperr.Internal("internal server error", ""))
			return
		}
		err = m.mediaRepository.UploadMedia(iPostId, blobName, fileType, bRestricted)
		if err != nil {
			m.logger.Sugar().Errorf("Error uploading media reference to database: %v", err)
			httperr.Write(w, httperr.Internal("internal server error", ""))
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
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
