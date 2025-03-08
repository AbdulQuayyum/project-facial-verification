document.addEventListener('DOMContentLoaded', () => {
    var scrollToTopBtn = document.getElementById("scrollToTopBtn");

    window.onscroll = function () {
        if (document.body.scrollTop > 150 || document.documentElement.scrollTop > 150) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };

    scrollToTopBtn.onclick = function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const BASE_URL = isLocal ? 'http://127.0.0.1:8888' : 'https://project-facial-verification.onrender.com';
    const MODELS_PATH = isLocal ? '/client/assets/models' : '/assets/models';
    const REQUIRED_BLINKS = 0;
    const VERIFICATION_THRESHOLD = 0.5;
    const RECORDING_DURATION = 5000;

    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('faceCanvas');
    const startButton = document.getElementById('startButton');
    const retryButton = document.getElementById('retryButton');
    const statusMessage = document.getElementById('statusMessage');
    const progressBar = document.getElementById('progressBar');
    const matricInput = document.getElementById('matricNumber');
    const loadingMessage = document.getElementById('loadingMessage');

    let isModelLoaded = false;
    let lastDetectedDescriptor = null;
    let stream = null;
    let capturedImageFile = null;

    function formatMatricNumber(matric) {
        matric = matric.trim();

        if (!/^\d{2}\/\d{2}[A-Z]{2}\d{3}$/.test(matric)) {
            throw new Error('Invalid matric number format. Expected format: XX/XXXXXXXX (e.g., 20/52HA001)');
        }

        return matric.substring(0, 2) + matric.substring(3);
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    function captureVideoFrame(videoElement) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // console.log('Captured frame:', {
        //     canvas: canvas,
        //     width: canvas.width,
        //     height: canvas.height,
        //     imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
        //     dataURL: canvas.toDataURL('image/jpeg')
        // });

        return canvas;
    }

    function canvasToBase64(canvas) {
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    async function initializeFaceAPI() {
        loadingMessage.style.display = 'flex';

        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_PATH),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH)
            ]);

            isModelLoaded = true;
            loadingMessage.style.display = 'none';
        } catch (error) {
            console.error('Model initialization error:', error);
            loadingMessage.textContent = 'Error loading models: ' + error.message;
            throw error;
        }
    }

    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            video.srcObject = stream;
        } catch (err) {
            throw new Error('Error accessing camera: ' + err.message);
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            video.style.display = 'none';
            canvas.style.position = "static";
        }
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = type;
    }

    async function fetchUserImage(matric) {
        try {
            const formattedMatric = formatMatricNumber(matric);
            // const response = await fetch(`${BASE_URL}/v1/verification/fetch-image?matric=${formattedMatric}`, {
            //     method: 'POST'
            // });
            const response = await fetch("/client/assets/images/2052HA027.jpg");
            console.log(response);

            if (!response.ok) {
                throw new Error("Failed to fetch image");
            }

            const blob = await response.blob();
            const imgURL = URL.createObjectURL(blob);

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load user image'));
                img.src = imgURL;
            });
        } catch (error) {
            console.error(error);
            throw new Error("Error loading image");
        }
    }

    function convertImageToBase64(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const base64Image = canvas.toDataURL("image/jpeg");
                resolve(base64Image);
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function detectFace(input) {
        try {
            console.log("Starting face detection");

            let imageInput;
            if (input instanceof HTMLVideoElement) {
                imageInput = captureVideoFrame(input);
                // console.log('Captured frame dimensions:', {
                //     width: imageInput.width,
                //     height: imageInput.height
                // });
            } else {
                imageInput = input;
            }

            if (!imageInput || !imageInput.width || !imageInput.height) {
                throw new Error('Invalid input image');
            }

            const detection = await faceapi
                .detectSingleFace(imageInput)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                throw new Error('No face detected in the input');
            }

            return detection;
        } catch (error) {
            console.error('Face detection error:', error);
            throw error;
        }
    }

    async function performLivenessCheck() {
        const detections = [];
        const startTime = Date.now();
        let blinkCount = 0;
        let lastEAR = null;
        let detectionCount = 0;
        let bestFrame = null;

        console.log('Starting liveness check...');

        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                try {
                    if (Date.now() - startTime >= RECORDING_DURATION) {
                        clearInterval(checkInterval);
                        console.log('Recording duration completed:', {
                            blinkCount,
                            detectionCount,
                            detectionsLength: detections.length
                        });

                        if (detections.length > 0) {
                            resolve({
                                success: blinkCount >= REQUIRED_BLINKS,
                                blinkCount,
                                detectionCount,
                                descriptor: detections[detections.length - 1].descriptor
                            });
                        } else {
                            reject(new Error('No face detections recorded during the session'));
                        }
                        return;
                    }

                    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                        console.log('Video not ready, skipping frame');
                        return;
                    }

                    const detection = await detectFace(video);

                    if (detection) {
                        console.log('Face detected in frame');
                        detectionCount++;
                        detections.push(detection);

                        const currentFrame = captureVideoFrame(video);
                        bestFrame = currentFrame;
                        capturedImageFile = await canvasToBase64(bestFrame)
                        try {
                            const ear = calculateEAR(detection.landmarks);
                            console.log('Calculated EAR:', ear);

                            if (lastEAR !== null) {
                                if (lastEAR > 0.2 && ear <= 0.2) {
                                    blinkCount++;
                                    console.log('Blink detected:', blinkCount);
                                }
                            }
                            lastEAR = ear;
                        } catch (earError) {
                            console.error('Error calculating EAR:', earError);
                        }

                        const progress = ((Date.now() - startTime) / RECORDING_DURATION) * 100;
                        progressBar.style.width = `${Math.min(progress, 100)}%`;

                        // console.log('Progress update:', {
                        //     progress: `${Math.min(progress, 100)}%`,
                        //     detectionCount,
                        //     blinkCount
                        // });
                    }
                } catch (error) {
                    console.error('Frame processing error:', error);
                }
            }, 200);

            setTimeout(() => {
                clearInterval(checkInterval);
                if (detections.length > 0) {
                    resolve({
                        success: blinkCount >= REQUIRED_BLINKS,
                        blinkCount,
                        detectionCount,
                        descriptor: detections[detections.length - 1].descriptor,
                        capturedImage: bestFrame ? canvasToBase64(bestFrame) : null
                    });
                } else {
                    reject(new Error('Liveness check timed out'));
                }
            }, RECORDING_DURATION + 1000);
        });
    }

    function calculateEAR(landmarks) {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        function getEyeAR(eye) {
            const p1 = eye[1], p2 = eye[5], p3 = eye[2], p4 = eye[4], p5 = eye[0], p6 = eye[3];
            return (
                (Math.hypot(p2.x - p1.x, p2.y - p1.y) + Math.hypot(p4.x - p3.x, p4.y - p3.y)) /
                (2 * Math.hypot(p6.x - p5.x, p6.y - p5.y))
            );
        }

        return (getEyeAR(leftEye) + getEyeAR(rightEye)) / 2;
    }

    async function verifyFaceMatch(storedImage) {
        if (!lastDetectedDescriptor) {
            throw new Error('No face descriptor available');
        }

        const storedFaceDetection = await detectFace(storedImage);

        if (!storedFaceDetection) {
            throw new Error('No face detected in stored image');
        }

        const distance = faceapi.euclideanDistance(
            lastDetectedDescriptor,
            storedFaceDetection.descriptor
        );
        const similarity = Math.max(0, 1 - distance);

        return {
            matched: similarity > VERIFICATION_THRESHOLD,
            confidence: similarity,
            details: {
                similarityScore: similarity,
                threshold: VERIFICATION_THRESHOLD
            }
        };
    }

    async function saveVerificationLog(verificationData) {
        try {
            const response = await fetch(`${BASE_URL}/v1/verification/record-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(verificationData)
            });

            if (!response.ok) {
                throw new Error('Failed to save verification log');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving verification log:', error);
            throw error;
        }
    }

    async function startVerification() {
        if (!isModelLoaded) {
            showStatus('Loading face detection models...', '');
            await initializeFaceAPI();
        }

        const matricNumber = matricInput.value.trim();
        if (!matricNumber) {
            showStatus('Please enter a matric number', 'error');
            return;
        }

        startButton.disabled = true;
        progressBar.style.width = '0%';
        showStatus('Starting verification process...', '');

        const startTime = Date.now();
        let livenessDetails = {};
        let verificationResult = {};
        const storedImage = await fetchUserImage(matricNumber);
        const storedImageUrl = storedImage.src;
        const storedImageBase64 = await convertImageToBase64(storedImageUrl);

        try {
            await startCamera();

            await new Promise((resolve) => {
                const checkVideo = () => {
                    if (video.readyState >= 2 && video.videoWidth > 0) {
                        resolve();
                    } else {
                        setTimeout(checkVideo, 10000);
                    }
                };
                checkVideo();
            });

            // console.log('Video ready:', {
            //     readyState: video.readyState,
            //     width: video.videoWidth,
            //     height: video.videoHeight
            // });

            showStatus('Performing liveness check...', '');
            const livenessResult = await performLivenessCheck().catch(error => {
                console.error('Liveness check failed:', error);
                throw new Error(`Liveness verification failed: ${error.message}`);
            });

            console.log('Liveness check completed:', livenessResult);

            if (!livenessResult || !livenessResult.descriptor) {
                throw new Error('Invalid liveness check result');
            }

            livenessDetails = {
                blinkCount: livenessResult.blinkCount,
                detectionCount: livenessResult.detectionCount,
                success: livenessResult.success
            };

            lastDetectedDescriptor = livenessResult.descriptor;

            showStatus('Fetching stored image...', '');

            showStatus('Verifying face match...', '');
            verificationResult = await verifyFaceMatch(storedImage);

            const verificationLogData = {
                matricNumber: formatMatricNumber(matricNumber),
                verificationStatus: verificationResult.matched ? 'success' : 'failure',
                confidenceScore: verificationResult.confidence,
                similarityScore: verificationResult.details.similarityScore,
                livenessDetails,
                storedImageUrl: storedImageBase64,
                capturedImageBase64: capturedImageFile,
                processingTime: Date.now() - startTime,
                userAgent: navigator.userAgent,
                errorMessage: verificationResult.matched ? null : 'Face mismatch detected'
            };

            await saveVerificationLog(verificationLogData);

            if (verificationResult.matched) {
                showStatus(
                    `Verification successful!\nConfidence: ${(verificationResult.confidence * 100).toFixed(1)}%\n` +
                    `Similarity Score: ${(verificationResult.details.similarityScore * 100).toFixed(1)}%`,
                    'success'
                );
                sessionStorage.setItem('verificationPassed', 'true');
                sessionStorage.setItem('matricNumber', formatMatricNumber(matricNumber));

                setTimeout(() => {
                    window.location.href = isLocal ? '/client/questions.html' : 'questions.html';
                }, 2000);
            } else {
                showStatus('Verification failed - Face mismatch detected', 'error');
                sessionStorage.removeItem('verificationPassed');
            }
        } catch (error) {
            const verificationLogData = {
                matricNumber: formatMatricNumber(matricNumber),
                verificationStatus: 'failure',
                confidenceScore: 0,
                similarityScore: 0,
                livenessDetails,
                storedImageUrl: storedImageBase64,
                capturedImageBase64: capturedImageFile,
                processingTime: Date.now() - startTime,
                userAgent: navigator.userAgent,
                errorMessage: error.message
            };

            try {
                await saveVerificationLog(verificationLogData);
            } catch (logError) {
                console.error('Error saving verification log:', logError);
            }

            showStatus(error.message, 'error');
            sessionStorage.removeItem('verificationPassed');
        } finally {
            lastDetectedDescriptor = null;
            stopCamera();
            startButton.disabled = false;
            retryButton.disabled = false;
        }
    }

    startButton.addEventListener('click', startVerification);
    retryButton.addEventListener('click', async () => {
        progressBar.style.width = '0%';
        showStatus('', '');
        retryButton.disabled = true;
        lastDetectedDescriptor = null;
        matricInput.value = '';
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        try {
            await startCamera();
            video.style.display = 'block';
            canvas.style.position = "absolute";
            await video.play();
        } catch (error) {
            showStatus('Error restarting camera: ' + error.message, 'error');
        }
    });
    initializeFaceAPI()
});

// document.addEventListener('DOMContentLoaded', () => {
//     var scrollToTopBtn = document.getElementById("scrollToTopBtn");

//     window.onscroll = function () {
//         if (document.body.scrollTop > 150 || document.documentElement.scrollTop > 150) {
//             scrollToTopBtn.style.display = "block";
//         } else {
//             scrollToTopBtn.style.display = "none";
//         }
//     };

//     scrollToTopBtn.onclick = function () {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//     };
//     const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

//     const BASE_URL = isLocal ? 'http://127.0.0.1:8888' : 'https://project-facial-verification.onrender.com';
//     const MODELS_PATH = isLocal ? '/client/assets/models' : '/assets/models';
//     const REQUIRED_BLINKS = 0;
//     const VERIFICATION_THRESHOLD = 0.5;
//     const RECORDING_DURATION = 5000;
//     const DIRECTIONS = ['center', 'left', 'right'];
//     const DIRECTION_THRESHOLDS = { left: -15, right: 15 };

//     let currentDirection = 'center';
//     let completedDirections = new Set(['center']);
//     let directionChangeTimeout = null;
//     let verificationPassed = false;
//     let bestFrameAfterDirections = null;

//     const video = document.getElementById('videoElement');
//     const canvas = document.getElementById('faceCanvas');
//     const startButton = document.getElementById('startButton');
//     const retryButton = document.getElementById('retryButton');
//     const statusMessage = document.getElementById('statusMessage');
//     const progressBar = document.getElementById('progressBar');
//     const matricInput = document.getElementById('matricNumber');
//     const loadingMessage = document.getElementById('loadingMessage');

//     let isModelLoaded = false;
//     let lastDetectedDescriptor = null;
//     let stream = null;
//     let capturedImageFile = null;
//     let storedImageBase64 = null;

//     async function detectHeadPose(landmarks) {
//         const nose = landmarks.getNose()[0];
//         const leftEye = landmarks.getLeftEye()[0];
//         const rightEye = landmarks.getRightEye()[0];
//         const leftCheek = landmarks.getLeftEye()[5];
//         const rightCheek = landmarks.getRightEye()[5];
//         const leftMouth = landmarks.getMouth()[0];
//         const rightMouth = landmarks.getMouth()[6];

//         const eyeDistance = Math.abs(leftEye.x - rightEye.x);
//         const eyeMidpoint = (leftEye.x + rightEye.x) / 2;
//         const noseOffset = nose.x - eyeMidpoint;
//         const yaw = (noseOffset / eyeDistance) * 100;

//         const eyeMouthDistance = ((leftMouth.y + rightMouth.y) / 2) - ((leftEye.y + rightEye.y) / 2);
//         const noseCheekDistance = ((leftCheek.y + rightCheek.y) / 2) - nose.y;
//         const pitch = (noseCheekDistance / eyeMouthDistance) * 100;

//         return { pitch, yaw };
//     }

//     function determineDirection(pose) {
//         if (pose.yaw < DIRECTION_THRESHOLDS.left) return 'left';
//         if (pose.yaw > DIRECTION_THRESHOLDS.right) return 'right';
//         if (pose.pitch < DIRECTION_THRESHOLDS.up) return 'up';
//         if (pose.pitch > DIRECTION_THRESHOLDS.down) return 'down';
//         return 'center';
//     }

//     function formatMatricNumber(matric) {
//         matric = matric.trim();

//         if (!/^\d{2}\/\d{2}[A-Z]{2}\d{3}$/.test(matric)) {
//             throw new Error('Invalid matric number format. Expected format: XX/XXXXXXXX (e.g., 20/52HA001)');
//         }

//         return matric.substring(0, 2) + matric.substring(3);
//     }

//     const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

//     function captureVideoFrame(videoElement) {
//         canvas.width = videoElement.videoWidth;
//         canvas.height = videoElement.videoHeight;
//         const ctx = canvas.getContext('2d');
//         ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

//         return canvas;
//     }

//     function canvasToBase64(canvas) {
//         return canvas.toDataURL('image/jpeg', 0.8);
//     }

//     async function initializeFaceAPI() {
//         loadingMessage.style.display = 'flex';

//         try {
//             await Promise.all([
//                 faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_PATH),
//                 faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
//                 faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH)
//             ]);

//             isModelLoaded = true;
//             loadingMessage.style.display = 'none';
//         } catch (error) {
//             console.error('Model initialization error:', error);
//             loadingMessage.textContent = 'Error loading models: ' + error.message;
//             throw error;
//         }
//     }

//     async function startCamera() {
//         try {
//             stream = await navigator.mediaDevices.getUserMedia({
//                 video: {
//                     facingMode: "user",
//                     width: { ideal: 640 },
//                     height: { ideal: 480 }
//                 }
//             });
//             video.srcObject = stream;
//         } catch (err) {
//             throw new Error('Error accessing camera: ' + err.message);
//         }
//     }

//     function stopCamera() {
//         if (stream) {
//             stream.getTracks().forEach(track => track.stop());
//             video.srcObject = null;
//             video.style.display = 'none';
//             canvas.style.position = "static";
//         }
//     }

//     function showStatus(message, type) {
//         statusMessage.textContent = message;
//         statusMessage.className = type;
//     }

//     async function fetchUserImage(matric) {
//         try {
//             const formattedMatric = formatMatricNumber(matric);
//             // const response = await fetch(`${BASE_URL}/v1/verification/fetch-image?matric=${formattedMatric}`, {
//             //     method: 'POST'
//             // });
//             const response = await fetch("/client/assets/images/2052HA027.jpg");
//             console.log(response);

//             if (!response.ok) {
//                 throw new Error("Failed to fetch image");
//             }

//             const blob = await response.blob();
//             const imgURL = URL.createObjectURL(blob);

//             return new Promise((resolve, reject) => {
//                 const img = new Image();
//                 img.onload = () => resolve(img);
//                 img.onerror = () => reject(new Error('Failed to load user image'));
//                 img.src = imgURL;
//             });
//         } catch (error) {
//             console.error(error);
//             throw new Error("Error loading image");
//         }
//     }

//     function convertImageToBase64(imageUrl) {
//         return new Promise((resolve, reject) => {
//             const img = new Image();
//             img.crossOrigin = "Anonymous";
//             img.onload = () => {
//                 const canvas = document.createElement("canvas");
//                 const ctx = canvas.getContext("2d");
//                 canvas.width = img.width;
//                 canvas.height = img.height;
//                 ctx.drawImage(img, 0, 0);
//                 const base64Image = canvas.toDataURL("image/jpeg");
//                 resolve(base64Image);
//             };
//             img.onerror = reject;
//             img.src = imageUrl;
//         });
//     }

//     function convertFileToBase64(file) {
//         return new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onloadend = () => resolve(reader.result);
//             reader.onerror = reject;
//             reader.readAsDataURL(file);
//         });
//     }

//     async function detectFace(input) {
//         try {
//             console.log("Starting face detection");

//             let imageInput;
//             if (input instanceof HTMLVideoElement) {
//                 imageInput = captureVideoFrame(input);
//             } else {
//                 imageInput = input;
//             }

//             if (!imageInput || !imageInput.width || !imageInput.height) {
//                 throw new Error('Invalid input image');
//             }

//             const detection = await faceapi
//                 .detectSingleFace(imageInput)
//                 .withFaceLandmarks()
//                 .withFaceDescriptor();

//             if (!detection) {
//                 throw new Error('No face detected in the input');
//             }

//             return detection;
//         } catch (error) {
//             console.error('Face detection error:', error);
//             throw error;
//         }
//     }

//     async function performLivenessCheck() {
//         const detections = [];
//         const startTime = Date.now();
//         let blinkCount = 0;
//         let lastEAR = null;
//         let detectionCount = 0;
//         let bestFrame = null;

//         const requiredDirections = ['center', 'right', 'left'];
//         let directionsToComplete = [...requiredDirections];
//         let currentDirectionIndex = 0;

//         completedDirections = new Set();
//         currentDirection = 'center';

//         console.log('Starting enhanced liveness check...');
//         showStatus(`Look at the camera (center) first`, '');

//         return new Promise((resolve, reject) => {
//             const checkInterval = setInterval(async () => {
//                 try {
//                 //     if (Date.now() - startTime >= RECORDING_DURATION) {
//                 //         clearInterval(checkInterval);

//                 //         // Check if all required directions are completed
//                 //         const allRequiredDirectionsCompleted = requiredDirections.every(dir =>
//                 //             completedDirections.has(dir)
//                 //         );

//                 //         if (allRequiredDirectionsCompleted && detections.length > 0) {
//                 //             bestFrameAfterDirections = captureVideoFrame(video);
//                 //             capturedImageFile = await canvasToBase64(bestFrameAfterDirections);

//                 //             resolve({
//                 //                 success: true,
//                 //                 blinkCount,
//                 //                 detectionCount,
//                 //                 descriptor: detections[detections.length - 1].descriptor,
//                 //                 completedDirections: Array.from(completedDirections),
//                 //                 allDirectionsCompleted: true,
//                 //             });
//                 //         } else {
//                 //             resolve({
//                 //                 success: false,
//                 //                 blinkCount,
//                 //                 detectionCount,
//                 //                 descriptor: detections.length > 0 ? detections[detections.length - 1].descriptor : null,
//                 //                 completedDirections: Array.from(completedDirections),
//                 //                 allDirectionsCompleted: false,
//                 //             });
//                 //         }
//                 //         return;
//                 //     }

//                     if (video.readyState !== video.HAVE_ENOUGH_DATA) {
//                         console.log('Video not ready, skipping frame');
//                         return;
//                     }

//                     const detection = await detectFace(video);

//                     if (detection) {
//                         console.log('Face detected in frame');
//                         detectionCount++;
//                         detections.push(detection);

//                         // const currentFrame = captureVideoFrame(video);
//                         // bestFrame = currentFrame;

//                         const pose = await detectHeadPose(detection.landmarks);
//                         const detectedDirection = determineDirection(pose);

//                         console.log('Detected direction:', detectedDirection, 'Pose:', pose);

//                         // Check if the detected direction is the one we're looking for
//                         if (detectedDirection === directionsToComplete[currentDirectionIndex] &&
//                             !completedDirections.has(detectedDirection)) {

//                             clearTimeout(directionChangeTimeout);
//                             directionChangeTimeout = setTimeout(() => {
//                                 completedDirections.add(detectedDirection);
//                                 currentDirectionIndex++;

//                                 if (currentDirectionIndex < directionsToComplete.length) {
//                                     showStatus(`Great! Now look ${directionsToComplete[currentDirectionIndex]}`, 'success');
//                                 } else {
//                                     showStatus(`All directions completed! Finishing verification...`, 'success');
//                                     bestFrameAfterDirections = captureVideoFrame(video);
//                                 }

//                                 console.log('Direction completed:', detectedDirection);
//                                 console.log('Completed directions:', Array.from(completedDirections));
//                             }, 1000);
//                         } else {
//                             // Only show instructions for the next direction if we haven't completed it
//                             if (!completedDirections.has(directionsToComplete[currentDirectionIndex])) {
//                                 showStatus(`Please look ${directionsToComplete[currentDirectionIndex]}`, '');
//                             }
//                         }

//                         try {
//                             const ear = calculateEAR(detection.landmarks);
//                             console.log('Calculated EAR:', ear);

//                             if (lastEAR !== null) {
//                                 if (lastEAR > 0.2 && ear <= 0.2) {
//                                     blinkCount++;
//                                     console.log('Blink detected:', blinkCount);
//                                 }
//                             }
//                             lastEAR = ear;
//                         } catch (earError) {
//                             console.error('Error calculating EAR:', earError);
//                         }

//                         const progress = ((Date.now() - startTime) / RECORDING_DURATION) * 100;
//                         progressBar.style.width = `${Math.min(progress, 100)}%`;
//                     }
//                 } catch (error) {
//                     console.error('Frame processing error:', error);
//                 }
//             }, 200);
//         });
//     }

//     function calculateEAR(landmarks) {
//         const leftEye = landmarks.getLeftEye();
//         const rightEye = landmarks.getRightEye();

//         function getEyeAR(eye) {
//             const p1 = eye[1], p2 = eye[5], p3 = eye[2], p4 = eye[4], p5 = eye[0], p6 = eye[3];
//             return (
//                 (Math.hypot(p2.x - p1.x, p2.y - p1.y) + Math.hypot(p4.x - p3.x, p4.y - p3.y)) /
//                 (2 * Math.hypot(p6.x - p5.x, p6.y - p5.y))
//             );
//         }

//         return (getEyeAR(leftEye) + getEyeAR(rightEye)) / 2;
//     }

//     async function verifyFaceMatch(storedImage) {
//         if (!lastDetectedDescriptor) {
//             throw new Error('No face descriptor available');
//         }

//         const storedFaceDetection = await detectFace(storedImage);

//         if (!storedFaceDetection) {
//             throw new Error('No face detected in stored image');
//         }

//         const distance = faceapi.euclideanDistance(
//             lastDetectedDescriptor,
//             storedFaceDetection.descriptor
//         );
//         const similarity = Math.max(0, 1 - distance);
//         verificationPassed = similarity > VERIFICATION_THRESHOLD;

//         return {
//             matched: verificationPassed,
//             confidence: similarity,
//             details: {
//                 similarityScore: similarity,
//                 threshold: VERIFICATION_THRESHOLD
//             }
//         };
//     }

//     async function saveVerificationLog(verificationData) {
//         try {
//             const response = await fetch(`${BASE_URL}/v1/verification/record-verification`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(verificationData)
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to save verification log');
//             }

//             return await response.json();
//         } catch (error) {
//             console.error('Error saving verification log:', error);
//             throw error;
//         }
//     }

//     async function startVerification() {
//         if (!isModelLoaded) {
//             showStatus('Loading face detection models...', '');
//             await initializeFaceAPI();
//         }

//         const matricNumber = matricInput.value.trim();
//         if (!matricNumber) {
//             showStatus('Please enter a matric number', 'error');
//             return;
//         }

//         startButton.disabled = true;
//         progressBar.style.width = '0%';
//         showStatus('Starting verification process...', '');

//         const startTime = Date.now();
//         let livenessDetails = {};
//         let verificationResult = {};
//         verificationPassed = false;

//         try {
//             // Fetch the stored image first
//             const storedImage = await fetchUserImage(matricNumber);
//             const storedImageUrl = storedImage.src;
//             storedImageBase64 = await convertImageToBase64(storedImageUrl);

//             await startCamera();

//             await new Promise((resolve) => {
//                 const checkVideo = () => {
//                     if (video.readyState >= 2 && video.videoWidth > 0) {
//                         resolve();
//                     } else {
//                         setTimeout(checkVideo, 10000);
//                     }
//                 };
//                 checkVideo();
//             });

//             // Step 1: Perform liveness check with directions
//             showStatus('Performing liveness check. Please follow direction instructions...', '');
//             const livenessResult = await performLivenessCheck();

//             console.log('Liveness check completed:', livenessResult);

//             if (!livenessResult || !livenessResult.descriptor) {
//                 throw new Error('Invalid liveness check result');
//             }


//             // Step 2: Only proceed with face verification if all required directions were completed
//             if (!livenessResult.allDirectionsCompleted) {
//                 throw new Error('Liveness check failed - Not all required head movements were completed. Please try again.');
//             }

//             livenessDetails = {
//                 blinkCount: livenessResult.blinkCount,
//                 detectionCount: livenessResult.detectionCount,
//                 completedDirections: livenessResult.completedDirections || [],
//                 allDirectionsCompleted: livenessResult.allDirectionsCompleted,
//                 success: livenessResult.success
//             };

//             // If all directions were completed, proceed with face verification
//             lastDetectedDescriptor = livenessResult.descriptor;

//             showStatus('Verifying face match...', '');
//             verificationResult = await verifyFaceMatch(storedImage);

//             const verificationLogData = {
//                 matricNumber: formatMatricNumber(matricNumber),
//                 verificationStatus: verificationResult.matched ? 'success' : 'failure',
//                 confidenceScore: verificationResult.confidence,
//                 similarityScore: verificationResult.details.similarityScore,
//                 livenessDetails,
//                 storedImageUrl: storedImageBase64,
//                 capturedImageBase64: capturedImageFile,
//                 processingTime: Date.now() - startTime,
//                 userAgent: navigator.userAgent,
//                 errorMessage: verificationResult.matched ? null : 'Face mismatch detected'
//             };

//             await saveVerificationLog(verificationLogData);

//             if (verificationResult.matched) {
//                 showStatus(
//                     `Verification successful!\nConfidence: ${(verificationResult.confidence * 100).toFixed(1)}%\n` +
//                     `Similarity Score: ${(verificationResult.details.similarityScore * 100).toFixed(1)}%`,
//                     'success'
//                 );
//                 sessionStorage.setItem('verificationPassed', 'true');
//                 sessionStorage.setItem('matricNumber', formatMatricNumber(matricNumber));

//                 setTimeout(() => {
//                     window.location.href = '/questions';
//                 }, 2000);
//             } else {
//                 showStatus('Verification failed - Face mismatch detected', 'error');
//                 sessionStorage.removeItem('verificationPassed');
//             }
//         } catch (error) {
//             const verificationLogData = {
//                 matricNumber: formatMatricNumber(matricNumber),
//                 verificationStatus: 'failure',
//                 confidenceScore: 0,
//                 similarityScore: 0,
//                 livenessDetails,
//                 storedImageUrl: storedImageBase64,
//                 capturedImageBase64: capturedImageFile,
//                 processingTime: Date.now() - startTime,
//                 userAgent: navigator.userAgent,
//                 errorMessage: error.message
//             };

//             try {
//                 await saveVerificationLog(verificationLogData);
//             } catch (logError) {
//                 console.error('Error saving verification log:', logError);
//             }

//             showStatus(error.message, 'error');
//             sessionStorage.removeItem('verificationPassed');
//         } finally {
//             lastDetectedDescriptor = null;
//             stopCamera();
//             startButton.disabled = false;
//             retryButton.disabled = false;
//         }
//     }

//     startButton.addEventListener('click', startVerification);
//     retryButton.addEventListener('click', async () => {
//         progressBar.style.width = '0%';
//         showStatus('', '');
//         retryButton.disabled = true;
//         lastDetectedDescriptor = null;
//         matricInput.value = '';
//         const ctx = canvas.getContext('2d');
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         try {
//             await startCamera();
//             video.style.display = 'block';
//             canvas.style.position = "absolute";
//             await video.play();
//         } catch (error) {
//             showStatus('Error restarting camera: ' + error.message, 'error');
//         }
//     });
//     initializeFaceAPI();
// });