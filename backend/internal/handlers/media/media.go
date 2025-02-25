package media

import (
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/KylerJacobson/blog/backend/internal/authorization"
	media_repo "github.com/KylerJacobson/blog/backend/internal/db/media"
	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
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
	logger          logger.Logger
	azClient        *azure.AzureClient
}

func New(mediaRepo media_repo.MediaRepository, logger logger.Logger, client *azure.AzureClient) *mediaApi {
	return &mediaApi{
		mediaRepository: mediaRepo,
		logger:          logger,
		azClient:        client,
	}
}

func (mediaApi *mediaApi) GetMediaByPostId(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	postId, err := strconv.Atoi(id)
	if err != nil {
		mediaApi.logger.Sugar().Errorf("GetPostId parameter was not an integer: %v", err)
		http.Error(w, "postId must be an integer", http.StatusBadRequest)
		return
	}

	token := session.Manager.GetString(r.Context(), "session_token")
	privilege := authorization.CheckPrivilege(token)

	media, err := mediaApi.mediaRepository.GetMediaByPostId(postId)
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
		url, err := mediaApi.azClient.GetUrlForBlob(attachment.BlobName)
		if err != nil {
			mediaApi.logger.Sugar().Errorf("error getting URL for blob: %v", err)
			http.Error(w, "postId must be an integer", http.StatusInternalServerError)
			return
		}
		postMediaSlc = append(postMediaSlc, postMedia{Url: url, ContentType: attachment.ContentType, Name: attachment.BlobName, PostId: attachment.PostId})
		if attachment.Restricted {
			if !privilege {
				http.Error(w, "user does not have access to restricted posts", http.StatusForbidden)
				return
			}
		}
	}
	b, err := json.Marshal(postMediaSlc)
	if err != nil {
		mediaApi.logger.Sugar().Errorf("error marshalling media post for post %d : %v", postId, err)
		w.WriteHeader(http.StatusInternalServerError)
		b, _ := json.Marshal(err)
		w.Write(b)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (mediaApi *mediaApi) DeleteMediaByPostId(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	postId, err := strconv.Atoi(id)
	if err != nil {
		mediaApi.logger.Sugar().Errorf("GetPostId parameter was not an integer: %v", err)
		http.Error(w, "postId must be an integer", http.StatusBadRequest)
		return
	}

	token := session.Manager.GetString(r.Context(), "session_token")
	claims := authorization.DecodeToken(token)
	if claims == nil {
		http.Error(w, "user does not have access to restricted posts", http.StatusForbidden)
		return
	}
	if claims.Role != 1 {
		http.Error(w, "user does not have access to delete posts", http.StatusForbidden)
		return
	}

	err = mediaApi.mediaRepository.DeleteMediaByPostId(postId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		b, _ := json.Marshal(err)
		w.Write(b)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (mediaApi *mediaApi) UploadMedia(w http.ResponseWriter, r *http.Request) {

	// Limit the size of the incoming request to 10 MB
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20) // 10 MB

	// Parse the multipart form data
	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Retrieve the files from the "files" form field
	restricted := r.Form.Get("restricted")
	postId := r.Form.Get("postId")
	iPostId, err := strconv.Atoi(postId)
	if err != nil {
		mediaApi.logger.Sugar().Errorf("postId parameter was not an integer: %v", err)
		http.Error(w, "postId must be an integer", http.StatusBadRequest)
		return
	}
	bRestricted, err := strconv.ParseBool(restricted)
	if err != nil {
		mediaApi.logger.Sugar().Errorf("restricted parameter was not a boolean: %v", err)
		http.Error(w, "postId must be an integer", http.StatusBadRequest)
		return
	}
	files := r.MultipartForm.File["photos"]
	if files == nil {
		http.Error(w, "No files uploaded", http.StatusBadRequest)
		return
	}
	if err != nil {
		mediaApi.logger.Sugar().Errorf("Error creating the azure blob client: %v", err)
		// return 500 error
	}
	for _, fileHeader := range files {
		// Process each file
		blobName := "blog-media/" + fileHeader.Filename
		err := mediaApi.azClient.UploadFileToBlob(fileHeader, blobName)
		if err != nil {
			mediaApi.logger.Sugar().Errorf("Error uploading media: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			b, _ := json.Marshal(err)
			w.Write(b)
			return
		}
		fileType, err := getFileContentType(fileHeader)
		if err != nil {
			mediaApi.logger.Sugar().Errorf("error getting the mime type of the file: %v", err)
			http.Error(w, "postId must be an integer", http.StatusInternalServerError)
			return
		}
		err = mediaApi.mediaRepository.UploadMedia(iPostId, blobName, fileType, bRestricted)
		if err != nil {
			mediaApi.logger.Sugar().Errorf("Error uploading media reference to database: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			b, _ := json.Marshal(err)
			w.Write(b)
			return
		}
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Files uploaded successfully"))
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
