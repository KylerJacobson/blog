require("dotenv").config();
const {
    BlobServiceClient,
    BlobSASPermissions,
    generateBlobSASQueryParameters,
} = require("@azure/storage-blob");
const ADMIN = 1;
const PRIVILEGED = 2;

class MediaController {
    constructor(mediaDao) {
        this.mediaDao = mediaDao;
    }

    async create(req, res) {
        if (req.payload.role != ADMIN) {
            return res.status(403).json({
                message: "You are not authorized to upload media",
            });
        }
        const files = req.files;
        const postId = req.body.postId;
        const restricted = req.body.restricted;
        const blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.AZURE_STORAGE_CONNECTION_STRING
        );

        try {
            const containerClient =
                blobServiceClient.getContainerClient("media");
            for (const file of files) {
                const blobName = `blog-media/${file.originalname}`;
                const blockBlobClient =
                    containerClient.getBlockBlobClient(blobName);
                const uploadBlobResponse = await blockBlobClient.uploadFile(
                    file.path
                );
                let mediaInstance = await this.mediaDao.uploadMedia(
                    postId,
                    blobName,
                    file.mimetype,
                    restricted
                );
            }

            res.status(200).json({
                message: "File uploaded to Azure Blob storage.",
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error uploading the file." });
        }
    }

    async show(req, res) {
        const { postId } = req.params;
        const role = req?.payload?.role;
        try {
            let media = await this.mediaDao.getMediaByPostId(postId);
            for (const i in media) {
                if (media[i].restricted === true) {
                    if (
                        !req.isAuthenticated ||
                        (role !== ADMIN && role !== PRIVILEGED)
                    ) {
                        return res.status(403).json({
                            message:
                                "You are not authorized to view this media",
                        });
                    }
                }
                const blobServiceClient =
                    BlobServiceClient.fromConnectionString(
                        process.env.AZURE_STORAGE_CONNECTION_STRING
                    );
                const containerClient =
                    blobServiceClient.getContainerClient("media");
                const blockBlobClient = containerClient.getBlockBlobClient(
                    media[i].blob_name
                );
                const sasOptions = {
                    containerName: "media",
                    blobName: media[i].blob_name,
                    startsOn: new Date(),
                    expiresOn: new Date(new Date().valueOf() + 86400),
                    permissions: BlobSASPermissions.parse("r"),
                };

                const sasToken = generateBlobSASQueryParameters(
                    sasOptions,
                    blobServiceClient.credential
                ).toString();
                const blobSasUrl = `${blockBlobClient.url}?${sasToken}`;
                media[i].url = blobSasUrl;
            }
            return res.status(200).json(media);
        } catch (error) {
            console.error(`Internal server error: ${error.message}`);
            return res.status(500).json({
                message: "Internal server error while retrieving media",
            });
        }
    }

    async destroy(req, res) {
        const { mediaId } = req.params;
        try {
            const media = await this.mediaDao.deleteMediaByMediaId(mediaId);
            return res.status(200).json({
                message: `Media ${mediaId} was successfully deleted`,
            });
        } catch (error) {
            console.error(`Internal server error: ${error.message}`);
            return res.status(500).json({
                message: "Internal server error while retrieving media",
            });
        }
    }
}

module.exports = MediaController;
