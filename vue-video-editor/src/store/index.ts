import { defineStore } from 'pinia'
import { fabric } from 'fabric';
import { getUid, isHtmlAudioElement, isHtmlImageElement, isHtmlVideoElement } from '@/utils';
import anime from 'animejs';
import type { MenuOption, EditorElement, Animation, TimeFrame, VideoEditorElement, AudioEditorElement, Placement, ImageEditorElement, Effect, TextEditorElement } from '../types';
import { FabricUitls } from '@/utils/fabric-utils';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { ref, computed } from 'vue';

function isEditorAudioElement(
  element: EditorElement
): element is AudioEditorElement {
  return element.type === "audio";
}

function isEditorVideoElement(
  element: EditorElement
): element is VideoEditorElement {
  return element.type === "video";
}

function isEditorImageElement(
  element: EditorElement
): element is ImageEditorElement {
  return element.type === "image";
}

function getTextObjectsPartitionedByCharacters(textObject: fabric.Text, element: TextEditorElement): fabric.Text[] {
  let copyCharsObjects: fabric.Text[] = [];
  // replace all line endings with blank
  const characters = (textObject.text ?? "").split('').filter((m) => m !== '\n');
  const charObjects = textObject.__charBounds;
  if (!charObjects) return [];
  const charObjectFixed = charObjects.map((m, index) => m.slice(0, m.length - 1).map(m => ({ m, index }))).flat();
  const lineHeight = textObject.getHeightOfLine(0);
  for (let i = 0; i < characters.length; i++) {
    if (!charObjectFixed[i]) continue;
    const { m: charObject, index: lineIndex } = charObjectFixed[i];
    const char = characters[i];
    const scaleX = textObject.scaleX ?? 1;
    const scaleY = textObject.scaleY ?? 1;
    const charTextObject = new fabric.Text(char, {
      left: charObject.left * scaleX + (element.placement.x),
      scaleX: scaleX,
      scaleY: scaleY,
      top: lineIndex * lineHeight * scaleY + (element.placement.y),
      fontSize: textObject.fontSize,
      fontWeight: textObject.fontWeight,
      fill: '#fff',
    });
    copyCharsObjects.push(charTextObject);
  }
  return copyCharsObjects;
}

export const useEditorStore = defineStore('editor', () => {
  // State
  const canvas = ref<fabric.Canvas | null>(null);
  const backgroundColor = ref('#111111');
  const selectedMenuOption = ref<MenuOption>('Video');
  const audios = ref<string[]>([]);
  const videos = ref<string[]>([]);
  const images = ref<string[]>([]);
  const editorElements = ref<EditorElement[]>([]);
  const selectedElement = ref<EditorElement | null>(null);
  const maxTime = ref(30 * 1000);
  const animations = ref<Animation[]>([]);
  const animationTimeLine = ref<anime.AnimeTimelineInstance>(anime.timeline());
  const playing = ref(false);
  const currentKeyFrame = ref(0);
  const fps = ref(60);
  const possibleVideoFormats = ref<string[]>(['mp4', 'webm']);
  const selectedVideoFormat = ref<'mp4' | 'webm'>('mp4');
  const startedTime = ref(0);
  const startedTimePlay = ref(0);

  // Computed
  const currentTimeInMs = computed(() => {
    return currentKeyFrame.value * 1000 / fps.value;
  });

  // Actions
  function setCurrentTimeInMs(time: number) {
    currentKeyFrame.value = Math.floor(time / 1000 * fps.value);
  }

  function setSelectedMenuOption(option: MenuOption) {
    selectedMenuOption.value = option;
  }

  function setCanvas(newCanvas: fabric.Canvas | null) {
    canvas.value = newCanvas;
    if (newCanvas) {
      newCanvas.backgroundColor = backgroundColor.value;
    }
  }

  function setBackgroundColor(newColor: string) {
    backgroundColor.value = newColor;
    if (canvas.value) {
      canvas.value.backgroundColor = newColor;
    }
  }

  function updateEffect(id: string, effect: Effect) {
    const index = editorElements.value.findIndex((element) => element.id === id);
    const element = editorElements.value[index];
    if (isEditorVideoElement(element) || isEditorImageElement(element)) {
      element.properties.effect = effect;
    }
    refreshElements();
  }

  function setVideos(newVideos: string[]) {
    videos.value = newVideos;
  }

  function addVideoResource(video: string) {
    videos.value = [...videos.value, video];
  }

  function addAudioResource(audio: string) {
    audios.value = [...audios.value, audio];
  }

  function addImageResource(image: string) {
    images.value = [...images.value, image];
  }

  function addAnimation(animation: Animation) {
    animations.value = [...animations.value, animation];
    refreshAnimations();
  }

  function updateAnimation(id: string, animation: Animation) {
    const index = animations.value.findIndex((a) => a.id === id);
    animations.value[index] = animation;
    refreshAnimations();
  }

  function refreshAnimations() {
    anime.remove(animationTimeLine.value);
    animationTimeLine.value = anime.timeline({
      duration: maxTime.value,
      autoplay: false,
    });
    
    for (let i = 0; i < animations.value.length; i++) {
      const animation = animations.value[i];
      const editorElement = editorElements.value.find((element) => element.id === animation.targetId);
      const fabricObject = editorElement?.fabricObject;
      if (!editorElement || !fabricObject) {
        continue;
      }
      fabricObject.clipPath = undefined;
      
      switch (animation.type) {
        case "fadeIn": {
          animationTimeLine.value.add({
            opacity: [0, 1],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, editorElement.timeFrame.start);
          break;
        }
        case "fadeOut": {
          animationTimeLine.value.add({
            opacity: [1, 0],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, editorElement.timeFrame.end - animation.duration);
          break;
        }
        case "slideIn": {
          const direction = animation.properties.direction;
          const targetPosition = {
            left: editorElement.placement.x,
            top: editorElement.placement.y,
          }
          const startPosition = {
            left: (direction === "left" ? - editorElement.placement.width : direction === "right" ? canvas.value?.width : editorElement.placement.x),
            top: (direction === "top" ? - editorElement.placement.height : direction === "bottom" ? canvas.value?.height : editorElement.placement.y),
          }
          if (animation.properties.useClipPath) {
            const clipRectangle = FabricUitls.getClipMaskRect(editorElement, 50);
            fabricObject.set('clipPath', clipRectangle)
          }
          if (editorElement.type === "text" && animation.properties.textType === "character") {
            canvas.value?.remove(...editorElement.properties.splittedTexts)
            // @ts-ignore
            editorElement.properties.splittedTexts = getTextObjectsPartitionedByCharacters(editorElement.fabricObject, editorElement);
            editorElement.properties.splittedTexts.forEach((textObject) => {
              canvas.value!.add(textObject);
            })
            const duration = animation.duration / 2;
            const delay = duration / editorElement.properties.splittedTexts.length;
            for (let i = 0; i < editorElement.properties.splittedTexts.length; i++) {
              const splittedText = editorElement.properties.splittedTexts[i];
              const offset = {
                left: splittedText.left! - editorElement.placement.x,
                top: splittedText.top! - editorElement.placement.y
              }
              animationTimeLine.value.add({
                left: [startPosition.left! + offset.left, targetPosition.left + offset.left],
                top: [startPosition.top! + offset.top, targetPosition.top + offset.top],
                delay: i * delay,
                duration: duration,
                targets: splittedText,
              }, editorElement.timeFrame.start);
            }
            animationTimeLine.value.add({
              opacity: [1, 0],
              duration: 1,
              targets: fabricObject,
              easing: 'linear',
            }, editorElement.timeFrame.start);
            animationTimeLine.value.add({
              opacity: [0, 1],
              duration: 1,
              targets: fabricObject,
              easing: 'linear',
            }, editorElement.timeFrame.start + animation.duration);

            animationTimeLine.value.add({
              opacity: [0, 1],
              duration: 1,
              targets: editorElement.properties.splittedTexts,
              easing: 'linear',
            }, editorElement.timeFrame.start);
            animationTimeLine.value.add({
              opacity: [1, 0],
              duration: 1,
              targets: editorElement.properties.splittedTexts,
              easing: 'linear',
            }, editorElement.timeFrame.start + animation.duration);
          }
          animationTimeLine.value.add({
            left: [startPosition.left, targetPosition.left],
            top: [startPosition.top, targetPosition.top],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, editorElement.timeFrame.start);
          break;
        }
        case "slideOut": {
          const direction = animation.properties.direction;
          const startPosition = {
            left: editorElement.placement.x,
            top: editorElement.placement.y,
          }
          const targetPosition = {
            left: (direction === "left" ? - editorElement.placement.width : direction === "right" ? canvas.value?.width : editorElement.placement.x),
            top: (direction === "top" ? -100 - editorElement.placement.height : direction === "bottom" ? canvas.value?.height : editorElement.placement.y),
          }
          if (animation.properties.useClipPath) {
            const clipRectangle = FabricUitls.getClipMaskRect(editorElement, 50);
            fabricObject.set('clipPath', clipRectangle)
          }
          animationTimeLine.value.add({
            left: [startPosition.left, targetPosition.left],
            top: [startPosition.top, targetPosition.top],
            duration: animation.duration,
            targets: fabricObject,
            easing: 'linear',
          }, editorElement.timeFrame.end - animation.duration);
          break;
        }
        case "breathe": {
          const itsSlideInAnimation = animations.value.find((a) => a.targetId === animation.targetId && (a.type === "slideIn"));
          const itsSlideOutAnimation = animations.value.find((a) => a.targetId === animation.targetId && (a.type === "slideOut"));
          const timeEndOfSlideIn = itsSlideInAnimation ? editorElement.timeFrame.start + itsSlideInAnimation.duration : editorElement.timeFrame.start;
          const timeStartOfSlideOut = itsSlideOutAnimation ? editorElement.timeFrame.end - itsSlideOutAnimation.duration : editorElement.timeFrame.end;
          if (timeEndOfSlideIn > timeStartOfSlideOut) {
            continue;
          }
          const duration = timeStartOfSlideOut - timeEndOfSlideIn;
          const easeFactor = 4;
          const suitableTimeForHeartbeat = 1000 * 60 / 72 * easeFactor
          const upScale = 1.05;
          const currentScaleX = fabricObject.scaleX ?? 1;
          const currentScaleY = fabricObject.scaleY ?? 1;
          const finalScaleX = currentScaleX * upScale;
          const finalScaleY = currentScaleY * upScale;
          const totalHeartbeats = Math.floor(duration / suitableTimeForHeartbeat);
          if (totalHeartbeats < 1) {
            continue;
          }
          const keyframes = [];
          for (let i = 0; i < totalHeartbeats; i++) {
            keyframes.push({ scaleX: finalScaleX, scaleY: finalScaleY });
            keyframes.push({ scaleX: currentScaleX, scaleY: currentScaleY });
          }

          animationTimeLine.value.add({
            duration: duration,
            targets: fabricObject,
            keyframes,
            easing: 'linear',
            loop: true
          }, timeEndOfSlideIn);
          break;
        }
      }
    }
  }

  function removeAnimation(id: string) {
    animations.value = animations.value.filter(
      (animation) => animation.id !== id
    );
    refreshAnimations();
  }

  function setSelectedElement(element: EditorElement | null) {
    selectedElement.value = element;
    if (canvas.value) {
      if (element?.fabricObject)
        canvas.value.setActiveObject(element.fabricObject);
      else
        canvas.value.discardActiveObject();
    }
  }

  function updateSelectedElement() {
    selectedElement.value = editorElements.value.find((element) => element.id === selectedElement.value?.id) ?? null;
  }

  function setEditorElements(elements: EditorElement[]) {
    editorElements.value = elements;
    updateSelectedElement();
    refreshElements();
  }

  function updateEditorElement(editorElement: EditorElement) {
    setEditorElements(editorElements.value.map((element) =>
      element.id === editorElement.id ? editorElement : element
    ));
  }

  function updateEditorElementTimeFrame(editorElement: EditorElement, timeFrame: Partial<TimeFrame>) {
    console.log(`Updating timeframe for element ${editorElement.id}:`, timeFrame);
    
    // Ensure time values are within valid boundaries
    if (timeFrame.start != undefined) {
      timeFrame.start = Math.max(0, timeFrame.start);
    }
    if (timeFrame.end != undefined) {
      timeFrame.end = Math.min(maxTime.value, timeFrame.end);
    }
    
    // Create a new element with updated timeframe
    const newEditorElement = {
      ...editorElement,
      timeFrame: {
        ...editorElement.timeFrame,
        ...timeFrame,
      }
    };
    
    // Update the element in store
    updateEditorElement(newEditorElement);
    
    // Update videos and audio to reflect the new timeframe
    // Force updates since this is a user-initiated change
    updateVideoElements(true);
    updateAudioElements(true);
    
    // Refresh animations with the new timeframe
    refreshAnimations();
    
    // Force a canvas update
    if (canvas.value) {
      canvas.value.requestRenderAll();
    }
    
    console.log(`Timeframe updated, element now spans ${newEditorElement.timeFrame.start}-${newEditorElement.timeFrame.end}ms`);
  }

  function addEditorElement(editorElement: EditorElement) {
    setEditorElements([...editorElements.value, editorElement]);
    refreshElements();
    setSelectedElement(editorElements.value[editorElements.value.length - 1]);
  }

  function removeEditorElement(id: string) {
    // Find the element to be removed
    const elementToRemove = editorElements.value.find(el => el.id === id);
    
    if (elementToRemove) {
      // If it's a video or audio element, clean up the HTML element
      if (elementToRemove.type === 'video' || elementToRemove.type === 'audio') {
        const mediaElement = document.getElementById(elementToRemove.properties.elementId);
        if (mediaElement) {
          // Stop playback if it's playing
          if (elementToRemove.type === 'video' && isHtmlVideoElement(mediaElement)) {
            mediaElement.pause();
            mediaElement.src = '';
            mediaElement.load();
          } else if (elementToRemove.type === 'audio' && isHtmlAudioElement(mediaElement)) {
            mediaElement.pause();
            mediaElement.src = '';
            mediaElement.load();
          }
          
          // Remove from DOM
          mediaElement.parentNode?.removeChild(mediaElement);
        }
      }
      
      // Remove the fabric object from canvas
      if (elementToRemove.fabricObject && canvas.value) {
        canvas.value.remove(elementToRemove.fabricObject);
      }
    }
    
    // Update the elements array
    setEditorElements(editorElements.value.filter(
      (editorElement) => editorElement.id !== id
    ));
    
    // Refresh canvas
    refreshElements();
    
    console.log(`Removed element with ID: ${id}`);
  }

  function setMaxTime(newMaxTime: number) {
    maxTime.value = newMaxTime;
  }

  // Store animation frame ID to be able to cancel it
  let animationFrameId: number | null = null;
  
  function setPlaying(isPlaying: boolean) {
    // Cancel any existing animation frame to prevent multiple loops
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    playing.value = isPlaying;
    updateVideoElements();
    updateAudioElements();
    
    if (isPlaying) {
      startedTime.value = Date.now();
      startedTimePlay.value = currentTimeInMs.value;
      
      // Start the animation loop with one requestAnimationFrame
      animationFrameId = requestAnimationFrame(playFrames);
      console.log("Starting playback at", currentTimeInMs.value);
    } else {
      console.log("Playback stopped at", currentTimeInMs.value);
    }
  }

  function playFrames() {
    // Clear the animation frame ID since this function is now running
    animationFrameId = null;
    
    // Exit if playback has been stopped
    if (!playing.value) {
      return;
    }
    
    // Calculate new timeline position based on elapsed time
    const elapsedTime = Date.now() - startedTime.value;
    const newTime = startedTimePlay.value + elapsedTime;
    
    // Update timeline position and all elements
    updateTimeTo(newTime);
    updateVideoElements();
    updateAudioElements();
    
    // Force render to ensure all changes are visible
    if (canvas.value) {
      canvas.value.requestRenderAll();
    }
    
    // Check if we've reached the end of the timeline
    if (newTime >= maxTime.value) {
      // Reset to beginning and stop playback
      console.log("Reached end of timeline");
      currentKeyFrame.value = 0;
      setPlaying(false);
      
      // Force an update of the final position
      updateTimeTo(0);
      updateVideoElements(true);
      updateAudioElements(true);
    } else {
      // Continue playback if still playing
      if (playing.value) {
        animationFrameId = requestAnimationFrame(playFrames);
      }
    }
  }

  function updateTimeTo(newTime: number) {
    setCurrentTimeInMs(newTime);
    animationTimeLine.value.seek(newTime);
    if (canvas.value) {
      canvas.value.backgroundColor = backgroundColor.value;
    }
    editorElements.value.forEach(
      e => {
        if (!e.fabricObject) return;
        const isInside = e.timeFrame.start <= newTime && newTime <= e.timeFrame.end;
        e.fabricObject.visible = isInside;
      }
    )
  }

  function handleSeek(seek: number) {
    console.log(`Seeking to ${seek}ms`);
    
    // Stop playback if currently playing
    if (playing.value) {
      setPlaying(false);
    }
    
    // Update time display and canvas 
    updateTimeTo(seek);
    
    // Force immediate update of all media elements
    // This ensures videos and audio are positioned at the correct time
    updateVideoElements(true); // Pass true to force update regardless of threshold
    updateAudioElements();
    
    // Request render update to ensure canvas reflects changes
    if (canvas.value) {
      canvas.value.requestRenderAll();
    }
  }

  function addVideo(index: number) {
    // Get the source video from the resources panel
    const sourceVideo = document.getElementById(`video-${index}`) as HTMLVideoElement;
    if (!isHtmlVideoElement(sourceVideo)) {
      console.error("Video element not found or not a video element");
      return;
    }
    
    console.log(`Adding video from source ${index}`);
    
    // Create a new video element that will be used by Fabric
    const videoElement = document.createElement('video');
    
    // Set video properties
    videoElement.src = sourceVideo.src;
    videoElement.crossOrigin = "anonymous";
    videoElement.autoplay = false;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.loop = false; // Important: disable loop to prevent infinite playback
    videoElement.controls = false;
    
    // Ensure we preload properly
    videoElement.preload = "auto";
    
    // Generate a unique ID for this element
    const id = getUid();
    videoElement.id = `video-${id}`;
    
    // Add the video element to the DOM (hidden) so it can start loading
    videoElement.style.position = "absolute";
    videoElement.style.left = "-9999px";
    videoElement.style.visibility = "hidden";
    document.body.appendChild(videoElement);
    
    // Let us know when loading fails
    videoElement.onerror = (e) => {
      console.error("Error loading video:", e);
    };
    
    // Handle metadata loading or timeout
    let hasAddedElement = false;
    
    // Function to add the element when ready
    const addVideoWhenReady = () => {
      // Prevent duplicate additions
      if (hasAddedElement) return;
      hasAddedElement = true;
      
      // Remove any waiting event listeners
      videoElement.removeEventListener('loadedmetadata', addVideoWhenReady);
      clearTimeout(timeoutId);
      
      // Get video properties (with fallbacks)
      const videoDurationMs = videoElement.duration * 1000 || 10000; // Default to 10s
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight || 16/9; // Default to 16:9
      
      console.log(`Adding video element with dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}, duration: ${videoDurationMs}ms`);
      
      // Create the editor element
      addEditorElement({
        id,
        name: `Video ${index + 1}`,
        type: "video",
        placement: {
          x: 100, // Center position
          y: 100,
          width: 200 * aspectRatio,
          height: 200,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: videoDurationMs,
        },
        properties: {
          elementId: videoElement.id,
          src: videoElement.src,
          effect: {
            type: "none",
          }
        },
      });
    };
    
    // Set up a timeout in case metadata loading takes too long
    const timeoutId = setTimeout(() => {
      console.warn("Video metadata loading timed out, using default values");
      addVideoWhenReady();
    }, 5000); // 5 second timeout
    
    // Try to load metadata
    videoElement.addEventListener('loadedmetadata', addVideoWhenReady);
    
    // Start loading the video
    try {
      videoElement.load();
    } catch (e) {
      console.error("Error loading video:", e);
      addVideoWhenReady(); // Fall back to default values
    }
  }

  function addImage(index: number) {
    const imageElement = document.getElementById(`image-${index}`)
    if (!isHtmlImageElement(imageElement)) {
      return;
    }
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const id = getUid();
    addEditorElement(
      {
        id,
        name: `Media(image) ${index + 1}`,
        type: "image",
        placement: {
          x: 0,
          y: 0,
          width: 100 * aspectRatio,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: maxTime.value,
        },
        properties: {
          elementId: `image-${id}`,
          src: imageElement.src,
          effect: {
            type: "none",
          }
        },
      },
    );
  }

  function addAudio(index: number) {
    const audioElement = document.getElementById(`audio-${index}`)
    if (!isHtmlAudioElement(audioElement)) {
      return;
    }
    const audioDurationMs = audioElement.duration * 1000;
    const id = getUid();
    addEditorElement(
      {
        id,
        name: `Media(audio) ${index + 1}`,
        type: "audio",
        placement: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: audioDurationMs,
        },
        properties: {
          elementId: `audio-${id}`,
          src: audioElement.src,
        }
      },
    );
  }

  function addText(options: { text: string, fontSize: number, fontWeight: number }) {
    const id = getUid();
    const index = editorElements.value.length;
    addEditorElement(
      {
        id,
        name: `Text ${index + 1}`,
        type: "text",
        placement: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        timeFrame: {
          start: 0,
          end: maxTime.value,
        },
        properties: {
          text: options.text,
          fontSize: options.fontSize,
          fontWeight: options.fontWeight,
          splittedTexts: [],
        },
      },
    );
  }

  function updateVideoElements(forceUpdate = false) {
    // Find all video elements in our editor
    const videoElements = editorElements.value.filter(
      (element): element is VideoEditorElement => element.type === "video"
    );
    
    if (videoElements.length === 0) return;
    
    // Get current timeline position
    const timelinePosition = currentTimeInMs.value;
    console.log(`Updating videos at timeline position: ${timelinePosition}ms`);
    
    // Track if any videos were updated
    let videosUpdated = false;
    
    // Update each video element
    videoElements.forEach((element) => {
      const video = document.getElementById(element.properties.elementId);
      
      if (!isHtmlVideoElement(video)) {
        console.warn(`Video element not found for ID: ${element.properties.elementId}`);
        return;
      }
      
      // Get video timeframe
      const videoStart = element.timeFrame.start;
      const videoEnd = element.timeFrame.end;
      
      // Check if video should be visible at current timeline position
      const isVisible = timelinePosition >= videoStart && timelinePosition <= videoEnd;
      
      // Update fabric object visibility if it exists
      if (element.fabricObject) {
        element.fabricObject.visible = isVisible;
        videosUpdated = true;
      }
      
      if (isVisible) {
        // Calculate relative position within video (in seconds)
        // This is the key calculation - determining where in the video we should be based on the timeline
        const videoRelativeTime = (timelinePosition - videoStart) / 1000;
        
        // Ensure time is within valid range for the video
        const validTime = Math.max(0, Math.min(videoRelativeTime, video.duration));
        
        // Update the video time position
        // Either if forced or if the change is significant (avoids constant small updates)
        const timeDifference = Math.abs(video.currentTime - validTime);
        if (forceUpdate || timeDifference > 0.1) {
          try {
            console.log(`Setting video ${element.id} time to ${validTime}s (timeline: ${timelinePosition}ms, start: ${videoStart}ms)`);
            video.currentTime = validTime;
            videosUpdated = true;
          } catch (e) {
            console.warn("Couldn't set video time:", e);
          }
        }
        
        // Handle playback state
        if (playing.value && video.paused) {
          try {
            // Start playback with catch for potential browser autoplay restrictions
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.warn("Autoplay prevented:", error);
              });
            }
          } catch (e) {
            console.warn("Video play error:", e);
          }
        } else if (!playing.value && !video.paused) {
          video.pause();
        }
      } else {
        // If video is not visible in the timeline, ensure it's paused and hidden
        if (!video.paused) {
          video.pause();
        }
      }
    });
    
    // Request a render update if changes were made
    if (videosUpdated && canvas.value) {
      canvas.value.requestRenderAll();
    }
  }

  function updateAudioElements(forceUpdate = false) {
    // Find all audio elements
    const audioElements = editorElements.value.filter(
      (element): element is AudioEditorElement => element.type === "audio"
    );
    
    if (audioElements.length === 0) return;
    
    // Get current timeline position
    const timelinePosition = currentTimeInMs.value;
    
    // Update each audio element
    audioElements.forEach((element) => {
      const audio = document.getElementById(element.properties.elementId);
      if (!isHtmlAudioElement(audio)) return;
      
      // Get audio timeframe
      const audioStart = element.timeFrame.start;
      const audioEnd = element.timeFrame.end;
      
      // Check if audio should be playing at current timeline position
      const isActive = timelinePosition >= audioStart && timelinePosition <= audioEnd;
      
      if (isActive) {
        // Calculate relative position within audio track (in seconds)
        const audioRelativeTime = (timelinePosition - audioStart) / 1000;
        
        // Ensure time is within valid range
        const validTime = Math.max(0, Math.min(audioRelativeTime, audio.duration));
        
        // Update the audio time position if needed
        const timeDifference = Math.abs(audio.currentTime - validTime);
        if (forceUpdate || timeDifference > 0.1) {
          try {
            audio.currentTime = validTime;
          } catch (e) {
            console.warn("Couldn't set audio time:", e);
          }
        }
        
        // Handle playback state
        if (playing.value && audio.paused) {
          try {
            audio.play().catch(e => console.warn("Audio play error:", e));
          } catch (e) {
            console.warn("Audio play error:", e);
          }
        } else if (!playing.value && !audio.paused) {
          audio.pause();
        }
      } else {
        // If audio is not active at this time, ensure it's paused
        if (!audio.paused) {
          audio.pause();
        }
      }
    });
  }

  function setVideoFormat(format: 'mp4' | 'webm') {
    selectedVideoFormat.value = format;
  }

  function saveCanvasToVideoWithAudio() {
    saveCanvasToVideoWithAudioWebmMp4();
  }

  function saveCanvasToVideoWithAudioWebmMp4() {
    console.log('modified')
    let mp4 = selectedVideoFormat.value === 'mp4'
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const stream = canvas.captureStream(30);
    const audioElements = editorElements.value.filter(isEditorAudioElement)
    const audioStreams: MediaStream[] = [];
    audioElements.forEach((audio) => {
      const audioElement = document.getElementById(audio.properties.elementId) as HTMLAudioElement;
      let ctx = new AudioContext();
      let sourceNode = ctx.createMediaElementSource(audioElement);
      let dest = ctx.createMediaStreamDestination();
      sourceNode.connect(dest);
      sourceNode.connect(ctx.destination);
      audioStreams.push(dest.stream);
    });
    audioStreams.forEach((audioStream) => {
      stream.addTrack(audioStream.getAudioTracks()[0]);
    });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.height = 500;
    video.width = 800;
    video.play().then(() => {
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data);
        console.log("data available");
      };
      mediaRecorder.onstop = async function (e) {
        const blob = new Blob(chunks, { type: "video/webm" });

        if (mp4) {
          // lets use ffmpeg to convert webm to mp4
          const data = new Uint8Array(await (blob).arrayBuffer());
          const ffmpeg = new FFmpeg();
          const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd"
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          await ffmpeg.writeFile('video.webm', data);
          await ffmpeg.exec(["-y", "-i", "video.webm", "-c", "copy", "video.mp4"]);

          const output = await ffmpeg.readFile('video.mp4');
          const outputBlob = new Blob([output], { type: "video/mp4" });
          const outputUrl = URL.createObjectURL(outputBlob);
          const a = document.createElement("a");
          a.download = "video.mp4";
          a.href = outputUrl;
          a.click();

        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "video.webm";
          a.click();
        }
      };
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, maxTime.value);
      video.remove();
    })
  }

  function refreshElements() {
    if (!canvas.value) return;
    
    canvas.value.remove(...canvas.value.getObjects());
    
    for (let index = 0; index < editorElements.value.length; index++) {
      const element = editorElements.value[index];
      
      switch (element.type) {
        case "video": {
          console.log("elementid", element.properties.elementId);
          if (document.getElementById(element.properties.elementId) == null)
            continue;
          const videoElement = document.getElementById(
            element.properties.elementId
          );
          if (!isHtmlVideoElement(videoElement)) continue;
          
          const videoObject = new fabric.CoverVideo(videoElement, {
            name: element.id,
            left: element.placement.x,
            top: element.placement.y,
            width: element.placement.width,
            height: element.placement.height,
            scaleX: element.placement.scaleX,
            scaleY: element.placement.scaleY,
            angle: element.placement.rotation,
            objectCaching: false,
            selectable: true,
            lockUniScaling: true,
            // @ts-ignore
            customFilter: element.properties.effect.type,
          });

          element.fabricObject = videoObject;
          element.properties.imageObject = videoObject;
          videoElement.width = 100;
          videoElement.height =
            (videoElement.videoHeight * 100) / videoElement.videoWidth;
          canvas.value.add(videoObject);
          canvas.value.on("object:modified", function (e) {
            if (!e.target) return;
            const target = e.target;
            if (target != videoObject) return;
            const placement = element.placement;
            const newPlacement: Placement = {
              ...placement,
              x: target.left ?? placement.x,
              y: target.top ?? placement.y,
              rotation: target.angle ?? placement.rotation,
              width:
                target.width && target.scaleX
                  ? target.width * target.scaleX
                  : placement.width,
              height:
                target.height && target.scaleY
                  ? target.height * target.scaleY
                  : placement.height,
              scaleX: 1,
              scaleY: 1,
            };
            const newElement = {
              ...element,
              placement: newPlacement,
            };
            updateEditorElement(newElement);
          });
          break;
        }
        case "image": {
          if (document.getElementById(element.properties.elementId) == null)
            continue;
          const imageElement = document.getElementById(
            element.properties.elementId
          );
          if (!isHtmlImageElement(imageElement)) continue;
          
          const imageObject = new fabric.CoverImage(imageElement, {
            name: element.id,
            left: element.placement.x,
            top: element.placement.y,
            angle: element.placement.rotation,
            objectCaching: false,
            selectable: true,
            lockUniScaling: true,
            // @ts-ignore
            customFilter: element.properties.effect.type,
          });
          
          element.fabricObject = imageObject;
          element.properties.imageObject = imageObject;
          const image = {
            w: imageElement.naturalWidth,
            h: imageElement.naturalHeight,
          };

          imageObject.width = image.w;
          imageObject.height = image.h;
          imageElement.width = image.w;
          imageElement.height = image.h;
          imageObject.scaleToHeight(image.w);
          imageObject.scaleToWidth(image.h);
          const toScale = {
            x: element.placement.width / image.w,
            y: element.placement.height / image.h,
          };
          imageObject.scaleX = toScale.x * element.placement.scaleX;
          imageObject.scaleY = toScale.y * element.placement.scaleY;
          canvas.value.add(imageObject);
          canvas.value.on("object:modified", function (e) {
            if (!e.target) return;
            const target = e.target;
            if (target != imageObject) return;
            const placement = element.placement;
            let fianlScale = 1;
            if (target.scaleX && target.scaleX > 0) {
              fianlScale = target.scaleX / toScale.x;
            }
            const newPlacement: Placement = {
              ...placement,
              x: target.left ?? placement.x,
              y: target.top ?? placement.y,
              rotation: target.angle ?? placement.rotation,
              scaleX: fianlScale,
              scaleY: fianlScale,
            };
            const newElement = {
              ...element,
              placement: newPlacement,
            };
            updateEditorElement(newElement);
          });
          break;
        }
        case "audio": {
          break;
        }
        case "text": {
          const textObject = new fabric.Textbox(element.properties.text, {
            name: element.id,
            left: element.placement.x,
            top: element.placement.y,
            scaleX: element.placement.scaleX,
            scaleY: element.placement.scaleY,
            width: element.placement.width,
            height: element.placement.height,
            angle: element.placement.rotation,
            fontSize: element.properties.fontSize,
            fontWeight: element.properties.fontWeight,
            objectCaching: false,
            selectable: true,
            lockUniScaling: true,
            fill: "#ffffff",
          });
          element.fabricObject = textObject;
          canvas.value.add(textObject);
          canvas.value.on("object:modified", function (e) {
            if (!e.target) return;
            const target = e.target;
            if (target != textObject) return;
            const placement = element.placement;
            const newPlacement: Placement = {
              ...placement,
              x: target.left ?? placement.x,
              y: target.top ?? placement.y,
              rotation: target.angle ?? placement.rotation,
              width: target.width ?? placement.width,
              height: target.height ?? placement.height,
              scaleX: target.scaleX ?? placement.scaleX,
              scaleY: target.scaleY ?? placement.scaleY,
            };
            const newElement = {
              ...element,
              placement: newPlacement,
              properties: {
                ...element.properties,
                // @ts-ignore
                text: target?.text,
              },
            };
            updateEditorElement(newElement);
          });
          break;
        }
        default: {
          throw new Error("Not implemented");
        }
      }
      if (element.fabricObject) {
        element.fabricObject.on("selected", function () {
          setSelectedElement(element);
        });
      }
    }
    
    const selectedEditorElement = selectedElement.value;
    if (selectedEditorElement && selectedEditorElement.fabricObject) {
      canvas.value.setActiveObject(selectedEditorElement.fabricObject);
    }
    
    refreshAnimations();
    updateTimeTo(currentTimeInMs.value);
    canvas.value.renderAll();
  }

  return {
    // State
    canvas,
    backgroundColor,
    selectedMenuOption,
    audios,
    videos,
    images,
    editorElements,
    selectedElement,
    maxTime,
    animations,
    animationTimeLine,
    playing,
    currentKeyFrame,
    fps,
    possibleVideoFormats,
    selectedVideoFormat,
    
    // Computed
    currentTimeInMs,
    
    // Actions
    setCurrentTimeInMs,
    setSelectedMenuOption,
    setCanvas,
    setBackgroundColor,
    updateEffect,
    setVideos,
    addVideoResource,
    addAudioResource,
    addImageResource,
    addAnimation,
    updateAnimation,
    refreshAnimations,
    removeAnimation,
    setSelectedElement,
    updateSelectedElement,
    setEditorElements,
    updateEditorElement,
    updateEditorElementTimeFrame,
    addEditorElement,
    removeEditorElement,
    setMaxTime,
    setPlaying,
    playFrames,
    updateTimeTo,
    handleSeek,
    addVideo,
    addImage,
    addAudio,
    addText,
    updateVideoElements,
    updateAudioElements,
    setVideoFormat,
    saveCanvasToVideoWithAudio,
    saveCanvasToVideoWithAudioWebmMp4,
    refreshElements
  }
})