package azure

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/sas"
	"github.com/KylerJacobson/blog/backend/logger"
)

type AzureClient struct {
	logger logger.Logger
}

func NewAzureClient(logger logger.Logger) *AzureClient {
	return &AzureClient{
		logger: logger,
	}
}

func (c *AzureClient) UploadFileToBlob(fileHeader *multipart.FileHeader, blobName string) error {
	connectionString := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")
	client, err := azblob.NewClientFromConnectionString(connectionString, nil)
	if err != nil {
		c.logger.Sugar().Errorf("error creating the client from the connection string: %v", err)
	}
	containerClient := client.ServiceClient().NewContainerClient("media")

	file, err := fileHeader.Open()
	if err != nil {
		return fmt.Errorf("error opening file: %v", err)
	}
	defer file.Close()

	blobClient := containerClient.NewBlockBlobClient(blobName)

	_, err = blobClient.UploadStream(context.Background(), file, nil)
	if err != nil {
		return fmt.Errorf("error uploading to blob: %v", err)
	}
	return nil
}

func (c *AzureClient) GetUrlForBlob(blobName string) (string, error) {
	connectionString := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")
	client, err := azblob.NewClientFromConnectionString(connectionString, nil)
	if err != nil {
		c.logger.Sugar().Errorf("error creating the client from the connection string: %v", err)
	}
	containerClient := client.ServiceClient().NewContainerClient("media")
	blobClient := containerClient.NewBlockBlobClient(blobName)
	// *container.GetSASURLOptions
	permission := sas.BlobPermissions{Read: true}
	start := time.Now()
	expiry := start.AddDate(1, 0, 0)
	options := blob.GetSASURLOptions{StartTime: &start}
	url, err := blobClient.GetSASURL(permission, expiry, &options)
	if err != nil {
		c.logger.Sugar().Errorf("error getting the sas URL for blob %s with error :%v", blobName, err)
		return "", err
	}
	return url, nil
}
