import { fabric } from "fabric";
import type { EditorElement } from "@/types";

declare module "fabric" {
  namespace fabric {
    class CoverVideo extends fabric.Image {
      constructor(
        element: HTMLVideoElement,
        options?: fabric.IImageOptions
      );
    }
    class CoverImage extends fabric.Image {
      constructor(
        element: HTMLImageElement,
        options?: fabric.IImageOptions
      );
    }
  }
}

fabric.CoverVideo = fabric.util.createClass(fabric.Image, {
  type: "cover-video",
  initialize: function (element: HTMLVideoElement, options: any) {
    this.callSuper("initialize", element, options);
    this._element = element;
    this._originalElement = element;
    this.filters = [];
    
    // Set video properties
    element.width = 640;
    element.height = 360;
    element.loop = false; // Don't loop automatically
    element.muted = true;
    element.autoplay = false;
    element.controls = false;
    element.crossOrigin = "anonymous";
    element.playsInline = true;
    
    // Hide the HTML video element
    element.style.display = "none";
    element.style.position = "absolute";
    element.style.left = "-9999px";
    
    // Add to DOM if not already there
    if (!element.parentNode) {
      document.body.appendChild(element);
    }
    
    // Store custom properties
    this.customFilter = options.customFilter;
    this.getElement().className = "video-element";
    
    // Force video to load content
    if (element.readyState < 2) { // HAVE_CURRENT_DATA = 2
      element.load();
    }
    
    // Log for debugging
    console.log(`Video initialized with dimensions: ${element.videoWidth}x${element.videoHeight}`);
    
    // We'll let the canvas handle rendering instead of forcing this object to be dirty
    // This avoids infinite loops and performance issues
  },
  
  _render: function (ctx: CanvasRenderingContext2D) {
    const videoElement = this.getElement() as HTMLVideoElement;
    
    if (videoElement && videoElement.readyState > 1) {
      const x = -this.width / 2;
      const y = -this.height / 2;
      
      // Apply filter if needed
      if (this.customFilter) {
        ctx.filter = getFilterCssValueFromFilterType(this.customFilter);
      }
      
      try {
        // Draw the video frame
        ctx.drawImage(videoElement, x, y, this.width, this.height);
        
        // Draw a border to help debug
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.width, this.height);
      } catch (e) {
        console.error("Error rendering video element", e);
      }
      
      // Reset filter
      ctx.filter = "none";
    } else {
      // Draw placeholder if video not ready
      const x = -this.width / 2;
      const y = -this.height / 2;
      ctx.fillStyle = "#333333";
      ctx.fillRect(x, y, this.width, this.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Loading video...", 0, 0);
    }
    
    this._renderStroke(ctx);
  }
});

fabric.CoverImage = fabric.util.createClass(fabric.Image, {
  type: "cover-image",
  initialize: function (element: HTMLImageElement, options: any) {
    this.callSuper("initialize", element, options);
    this._element = element;
    this._originalElement = element;
    this.getElement().className = "image-element";
    this.filters = [];
    this.customFilter = options.customFilter;
  },
  _render: function (ctx: CanvasRenderingContext2D) {
    let imageElement = this.getElement() as any;

    // Set the filter before rendering, using straight CSS filters
    if (this.customFilter) {
      ctx.filter = getFilterCssValueFromFilterType(this.customFilter);
    }

    // Draw the image
    const x = -this.width / 2;
    const y = -this.height / 2;
    ctx.drawImage(imageElement, x, y, this.width, this.height);

    // Clean up filter after rendering
    this._renderStroke(ctx);
    ctx.filter = "none";
  },
});

export function getFilterCssValueFromFilterType(filterType: string): string {
  switch (filterType) {
    case "blackAndWhite":
      return "grayscale(100%)";
    case "sepia":
      return "sepia(100%)";
    case "invert":
      return "invert(100%)";
    case "saturate":
      return "saturate(200%)";
    default:
      return "none";
  }
}

export class FabricUitls {
  static getClipMaskRect(
    element: EditorElement,
    padding: number
  ): fabric.Rect {
    const width = element.placement.width * element.placement.scaleX;
    const height = element.placement.height * element.placement.scaleY;

    return new fabric.Rect({
      left: -width / 2 - padding,
      top: -height / 2 - padding,
      width: width + padding * 2,
      height: height + padding * 2,
      absolutePositioned: true,
    });
  }
}