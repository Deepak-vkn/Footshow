// imageProcessing.js

async function processImages(images) {
    const processedImages = [];

    for (const image of images) {
        const processedImageBuffer = await sharp(image.buffer)
            .resize(377.75, 377) // Adjust dimensions as needed
            .toBuffer();

        const processedImage = {
            buffer: processedImageBuffer,
            mimetype: 'image/png', // Change to appropriate mimetype
            originalname: image.originalname,
        };

        processedImages.push(processedImage);
    }

    return processedImages;
}
