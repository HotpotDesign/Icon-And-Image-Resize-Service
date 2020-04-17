// ================================================================================
// ImageResizerClass
// ================================================================================
var ImageResizerClass = (function() {
	// ==============================================================================
	// Enums
	// ==============================================================================
	var imageType = {
     	png: 0,
     	jpg: 1,
     	svg: 2,
     	gif: 3
	};


	var requestType = {
     	png: 0,
     	jpg: 1,
     	gif: 2,
     	svg: 3,
		iosIcon: 4,
		iosImage: 5,
		androidIcon: 6,
		androidImage: 8,
		chrome: 9,
		windows: 10,
		firefox: 11,
		macOS: 12,
		favicon: 13
	};


	// ==============================================================================
	// Public Functions
	// ==============================================================================
	function createRequestList(requestTypeList, fileStem, imageType, naturalWidth, naturalHeight) {
		// Set default result.
		var list = [];

		// Append requests for each type.
		$.each(requestTypeList, function() {
			// Set request type.
			var curType = parseInt(this);

			// Handle requests based on type.
			var req = null;
			switch (curType) {
				case requestType.png:
					req = createResizeRequest("/", fileStem, ImageResizerClass.imageType.png, naturalWidth, naturalHeight, 1);
					break;

				case requestType.jpg:
					req = createResizeRequest("/", fileStem, ImageResizerClass.imageType.jpg, naturalWidth, naturalHeight, 1);
					break;

				case requestType.iosIcon:
					req = createIOSIconRequests(fileStem, imageType);
					break;

				case requestType.iosImage:
					req = createIOSImageRequests(fileStem, imageType, naturalWidth, naturalHeight);
					break;

				case requestType.androidIcon:
					req = createAndroidIconRequests(fileStem, imageType);
					break;
				
				case requestType.androidImage:
					req = createAndroidImageRequests(fileStem, imageType, naturalWidth, naturalHeight);
					break;

				case requestType.chrome:
					req = createChromeRequests(fileStem, imageType);
					break;

				case requestType.windows:
					req = createWindowsRequests(fileStem, imageType);
					break;

				case requestType.firefox:
					req = createFirefoxRequests(fileStem, imageType);
					break;

				case requestType.macOS:
					req = createMacOSRequests(fileStem, imageType);
					break;	

				case requestType.favicon:
					req = createFaviconRequests(fileStem, imageType);
					break;									

				default:
					debug("Error processing request: unknown type. Type: " + curType);
					break;
			}

			// Append request?
			if (req) {
				list.push(req);
			}
		});

		// Flatten list.
		list = [].concat.apply([], list);

		// Return list.
		return list;
	}
   

   function resize(image, requestList, folderName) {
		// Convert image to requested sizes.
		var resizePromises = getResizePromises(image, requestList);

		// Automatically trigger download when promises ready.
		$.when(...resizePromises).then((...imageList) => {
			downloadImages(imageList, folderName);
		});
   }


	function getResizePromises(image, requestList) {
		// Create array of all resize promises.
		var resizePromises = requestList.map(function(request) {
			return getCanvasResizePromise(image, request.filepath, request.newWidth, request.newHeight);
		});

		// Return result.
		return resizePromises;
	}   


	// ================================================================================
	// Canvas Functions
	// ================================================================================
	// Resize image by writing image to canvas. We must create the canvas each time
	// because reusing same canvas doesn't work consistently across all browsers.
	function getCanvasResizePromise(image, filepath, canvasWidth, canvasHeight) {
   	// Create promise.
   	var promise = $.Deferred();

		// Create canvas element.
		var canvas = $(document.createElement("canvas"));

		// Get canvas context.
		var context = canvas[0].getContext("2d");

		// Set canvas size.
		canvas[0].width = canvasWidth;
		canvas[0].height = canvasHeight;

		// Set image size, must use image.naturalWidth and image.naturalHeight -- not image.width and image.height.
		const imageWidth = image.naturalWidth;
		const imageHeight = image.naturalHeight;

		// Set scale to fit image to canvas, 
		const scale = Math.min(canvasWidth/imageWidth, canvasHeight/imageHeight);

		// Set new image dimensions.
		const scaledWidth = imageWidth * scale;
		const scaledHeight = imageHeight * scale;

		// Draw image in center of canvas.
		context.drawImage(image, (canvasWidth - scaledWidth)/2, (canvasHeight - scaledHeight)/2, scaledWidth, scaledHeight);

		// Set blob type, default to PNG.
		var blobType = "image/png";

		// JPG?
		if (filepath.endsWith("jpg")) {
			blobType == "image/jpeg";
		
		// Nope, GIF?
		} else if (filepath.endsWith("gif")) {
			blobType == "image/gif";
		}

		// Export canvas content as image.
		canvas[0].toBlob(function(blob) {
			// Resolve promise.
			promise.resolve({
			   filepath: filepath,
			   image: blob
			});

			// Remove canvas from document.
			canvas.remove();
		}, blobType);

		// Return promise.
		return promise;
	}
   

	// ================================================================================
	// Zip Functions
	// ================================================================================
	function downloadImages(imageList, folderName) {
		// Set folder variables.
		var folderExt = "zip";
		var folderBase = "Hotpot Design";

		// Append folder name?
		if (folderName) {
			folderBase = folderBase + " - " + folderName;
		}

		// Set folder name.
		var zipFolderName = folderBase + "." + folderExt;

		// Create new JSZip object.
		var zip = new JSZip();

		// Add each image to zip folder.
		imageList.forEach(function(image) {
			zip.file(image.filepath, image.image, {base64: true});
		});

		// Generate zip folder.
		zip.generateAsync({
			type: "blob",
			createFolders: true
		}).then(function(content) {
			// Save files.
		   saveAs(content, zipFolderName);

		   // Hide loading ball.
		   toggleLoadingBall(false);
		}).catch(e => console.log(e));
	}


	// ================================================================================
	// Request Functions
	// ================================================================================
	function createFaviconRequests(fileStem, imageType) {		
		// Set dir path.
		var dirPath = "Favicons";
	
		// Set request list.
		var list = [
			createResizeRequest(dirPath, "favicon-16x16", imageType, 16, 16),
			createResizeRequest(dirPath, "favicon-24x24", imageType, 24, 24),
			createResizeRequest(dirPath, "favicon-32x32", imageType, 32, 32),
			createResizeRequest(dirPath, "favicon-48x48", imageType, 48, 48),
			createResizeRequest(dirPath, "favicon-57x57", imageType, 57, 57),
			createResizeRequest(dirPath, "favicon-60x60", imageType, 60, 60),
			createResizeRequest(dirPath, "favicon-64x64", imageType, 64, 64),
			createResizeRequest(dirPath, "favicon-70x70", imageType, 70, 70),
			createResizeRequest(dirPath, "favicon-72x72", imageType, 72, 72),
			createResizeRequest(dirPath, "favicon-76x76", imageType, 76, 76),
			createResizeRequest(dirPath, "favicon-96x96", imageType, 96, 96),
			createResizeRequest(dirPath, "favicon-114x114", imageType, 114, 114),
			createResizeRequest(dirPath, "favicon-120x120", imageType, 120, 120),
			createResizeRequest(dirPath, "favicon-128x128", imageType, 128, 128),
			createResizeRequest(dirPath, "favicon-144x144", imageType, 144, 144),
			createResizeRequest(dirPath, "favicon-150x150", imageType, 150, 150),
			createResizeRequest(dirPath, "favicon-152x152", imageType, 152, 152),
			createResizeRequest(dirPath, "favicon-180x180", imageType, 180, 180),
			createResizeRequest(dirPath, "favicon-192x192", imageType, 192, 192),
			createResizeRequest(dirPath, "favicon-196x196", imageType, 196, 196),
			createResizeRequest(dirPath, "favicon-310x310", imageType, 310, 310),
		];

		// Return request list.
		return list;
	}


	function createMacOSRequests(fileStem, imageType) {		
		// Set dir path.
		var dirPath = "MacOS.appiconset";
	
		// Set request list.
		var list = [
			createResizeRequest(dirPath, "icon-16x16", imageType, 16, 16),
			createResizeRequest(dirPath, "icon-32x32", imageType, 32, 32),
			createResizeRequest(dirPath, "icon-64x64", imageType, 64, 64),
			createResizeRequest(dirPath, "icon-128x128", imageType, 128, 128),
			createResizeRequest(dirPath, "icon-256x256", imageType, 256, 256),
			createResizeRequest(dirPath, "icon-512x512", imageType, 512, 512),
		];

		// Return request list.
		return list;
	}


	function createIOSIconRequests(fileStem, imageType) {
		// Set dir path.
		var dirPath = "AppIcon.appiconset";
	
		// Set request list, start with default icons.
		var list = [
			createResizeRequest(dirPath, "Icon-20", imageType, 20, 20),
			createResizeRequest(dirPath, "Icon-20@2x", imageType, 40, 40),
			createResizeRequest(dirPath, "Icon-20@3x", imageType, 60, 60),
			createResizeRequest(dirPath, "Icon-29", imageType, 29, 29),
			createResizeRequest(dirPath, "Icon-29@2x", imageType, 58, 58),
			createResizeRequest(dirPath, "Icon-29@3x", imageType, 87, 87),
			createResizeRequest(dirPath, "Icon-40", imageType, 40, 40),
			createResizeRequest(dirPath, "Icon-40@2x", imageType, 80, 80),
			createResizeRequest(dirPath, "Icon-40@3x", imageType, 120, 120),
			createResizeRequest(dirPath, "Icon-50", imageType, 50, 50),
			createResizeRequest(dirPath, "Icon-50@2x", imageType, 100, 100),
			createResizeRequest(dirPath, "Icon-57", imageType, 57, 57),
			createResizeRequest(dirPath, "Icon-57@2x", imageType, 114, 114),
			createResizeRequest(dirPath, "Icon-60@2x", imageType, 120, 120),
			createResizeRequest(dirPath, "Icon-60@3x", imageType, 180, 180),
			createResizeRequest(dirPath, "Icon-72", imageType, 72, 72),
			createResizeRequest(dirPath, "Icon-72@2x", imageType, 144, 144),
			createResizeRequest(dirPath, "Icon-76", imageType, 76, 76),
			createResizeRequest(dirPath, "Icon-76@2x", imageType, 152, 152),
			createResizeRequest(dirPath, "Icon-83.5@2x", imageType, 167, 167),
			createResizeRequest(dirPath, "iTunesArtwork-1024", imageType, 1024, 1024),
		];

		// Add AppleWatch requests.
		list = list.concat([
			createResizeRequest(dirPath, "AppleWatch-Icon-24@2x", imageType, 48, 48),
			createResizeRequest(dirPath, "AppleWatch-Icon-27.5@2x", imageType, 55, 55),
			createResizeRequest(dirPath, "AppleWatch-Icon-29@2x", imageType, 58, 58),
			createResizeRequest(dirPath, "AppleWatch-Icon-29@3x", imageType, 87, 87),
			createResizeRequest(dirPath, "AppleWatch-Icon-40@2x", imageType, 80, 80),
			createResizeRequest(dirPath, "AppleWatch-Icon-44@2x", imageType, 88, 88),
			createResizeRequest(dirPath, "AppleWatch-Icon-86@2x", imageType, 172, 172),
			createResizeRequest(dirPath, "AppleWatch-Icon-98@2x", imageType, 196, 196),
		]);

		// Return list.
		return list;
	}


	function createIOSImageRequests(fileStem, imageType, naturalWidth, naturalHeight) {
		// Set dir path.
		var dirPath = "iOS Image";

		// Set base size.
		var ratio = 1/3;
		var baseWidth = naturalWidth * ratio;
		var baseHeight = naturalHeight * ratio;

		// Set request list.
		var list = [
			createResizeRequest(dirPath, fileStem + "@1x", imageType, baseWidth, baseHeight, 1),
			createResizeRequest(dirPath, fileStem + "@2x", imageType, baseWidth, baseHeight, 2),
			createResizeRequest(dirPath, fileStem + "@3x", imageType, baseWidth, baseHeight, 3),
		];
		
		// Return list.
		return list;
	}


	function createWindowsRequests(fileStem, imageType) {
		// Set dir path.
		var dirPath = "Windows";
		
		// Set request list, start with target assets.
		var list = [
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-16", imageType, 16, 16),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-20", imageType, 20, 20),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-24", imageType, 24, 24),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-30", imageType, 30, 30),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-32", imageType, 32, 32),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-36", imageType, 36, 36),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-40", imageType, 40, 40),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-48", imageType, 48, 48),			
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-60", imageType, 60, 60),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-64", imageType, 64, 64),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-72", imageType, 72, 72),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-80", imageType, 80, 80),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-96", imageType, 96, 96),
			createResizeRequest(dirPath, "Square44x44Logo.targetsize-256", imageType, 256, 256),			
		];

		// Append 71 logos.
		list = list.concat([
			createResizeRequest(dirPath, "Square71x71Logo.scale-100", imageType, 71, 71),
			createResizeRequest(dirPath, "Square71x71Logo.scale-125", imageType, 89, 89),
			createResizeRequest(dirPath, "Square71x71Logo.scale-150", imageType, 107, 107),
			createResizeRequest(dirPath, "Square71x71Logo.scale-200", imageType, 142, 142),
			createResizeRequest(dirPath, "Square71x71Logo.scale-400", imageType, 284, 284),
		]);

		// Append 150 logos.
		list = list.concat([
			createResizeRequest(dirPath, "Square150x150Logo.scale-100", imageType, 150, 150),
			createResizeRequest(dirPath, "Square150x150Logo.scale-125", imageType, 188, 188),
			createResizeRequest(dirPath, "Square150x150Logo.scale-150", imageType, 225, 225),
			createResizeRequest(dirPath, "Square150x150Logo.scale-200", imageType, 300, 300),
			createResizeRequest(dirPath, "Square150x150Logo.scale-400", imageType, 600, 600),
		]);

		// Append 310 logos.
		list = list.concat([
			createResizeRequest(dirPath, "Square310x310Logo.scale-100", imageType, 310, 310),
			createResizeRequest(dirPath, "Square310x310Logo.scale-125", imageType, 388, 388),
			createResizeRequest(dirPath, "Square310x310Logo.scale-150", imageType, 465, 465),
			createResizeRequest(dirPath, "Square310x310Logo.scale-200", imageType, 620, 620),
			createResizeRequest(dirPath, "Square310x310Logo.scale-400", imageType, 1240, 1240),
		]);			

		// Append store logos.
		list = list.concat([
			createResizeRequest(dirPath, "StoreLogo.scale-71", imageType, 71, 71),
			createResizeRequest(dirPath, "StoreLogo.scale-150", imageType, 150, 150),
			createResizeRequest(dirPath, "StoreLogo.scale-300", imageType, 300, 300),			
		]);

		// Return list.
		return list;
	}


	function createAndroidIconRequests(fileStem, imageType) {
		// Set dir path.
		var dirPath = "Android Icons";
		
		// Set sizes for iOS icons.
		var sizeList = [
			48,
			72,
			96,
			144,
			192,
		];

		// Return request list.
		return sizeListToSquareRequestList(dirPath, fileStem, imageType, sizeList);
	}


	function createChromeRequests(fileStem, imageType) {
		// Set dir path.
		var dirPath = "Chrome Store";
		
		// Set sizes for iOS icons.
		var sizeList = [
			16,
			48,
			128,
		];

		// Return request list.
		return sizeListToSquareRequestList(dirPath, fileStem, imageType, sizeList);
	}


	function createFirefoxRequests(fileStem, imageType) {
		// Set dir path.
		var dirPath = "Firefox";
		
		// Set sizes for iOS icons.
		var sizeList = [
			48,
			96,
		];

		// Return request list.
		return sizeListToSquareRequestList(dirPath, fileStem, imageType, sizeList);
	}


	function createAndroidImageRequests(fileStem, imageType, naturalWidth, naturalHeight) {
		// Set dir path.
		var dirPath = "Android Image";

		// Set base size.
		var ratio = 1/4;
		var baseWidth = naturalWidth * ratio;
		var baseHeight = naturalHeight * ratio;

		// Set request list.
		var list = [
			createResizeRequest(dirPath, "ldpi", imageType, baseWidth, baseHeight, 0.75),
			createResizeRequest(dirPath, "mdpi", imageType, baseWidth, baseHeight, 1),
			createResizeRequest(dirPath, "hdpi", imageType, baseWidth, baseHeight, 1.5),
			createResizeRequest(dirPath, "xhdpi", imageType, baseWidth, baseHeight, 2),
			createResizeRequest(dirPath, "xxhdpi", imageType, baseWidth, baseHeight, 3),
			createResizeRequest(dirPath, "xxxhdpi", imageType, baseWidth, baseHeight, 4),
		];
		
		// Return list.
		return list;
	}


	function sizeListToSquareRequestList(dirPath, fileStem, imageType, sizeList) {
		// Create requests for each size.
		var list = [];
		sizeList.forEach(function(size) {
			var fileStem = size + "x" + size;
			var req = createResizeRequest(dirPath, fileStem, imageType, size, size);
			list.push(req);
		});

		// Return list.
		return list;
	}


	function createResizeRequest(dirPath, fileStem, imageType, width, height, ratio) {
		// Set target size for image.
		var targetWidth = width;
		var targetHeight = height;

		// Apply ratio?
		if (ratio) {
			targetWidth = Math.round(targetWidth * ratio);
			targetHeight = Math.round(targetHeight * ratio);
		}

		// Set file extension.
		// Set default file extension.
		var fileExtension = null;

		// Dealing with PNG?
		if (imageType === ImageResizerClass.imageType.png) {
			fileExtension = "png";

		// Nope, JPG?
		} else if (imageType === ImageResizerClass.imageType.jpg) {
			fileExtension = "jpg";
		
		// Nope, GIF?
		} else if (imageType === ImageResizerClass.imageType.gif) {
			fileExtension = "gif";
		}

		// Exit if unknown output type.
		if (!fileExtension) {
			console.log("Error resizing image: unknown output type. Output type: " + imageType);
			return;
		}

		// Set filepath.
		var filepath = dirPath + "/" + fileStem + "." + fileExtension;

		// Return object.
		return {
			filepath: filepath,
			newWidth: targetWidth,
			newHeight: targetHeight
		}
	}


	// ============================================================================
	// Class API
	// ============================================================================
	return {
		imageType: imageType,
		requestType: requestType,
		resize: resize,
		createRequestList: createRequestList,
	};
})();
