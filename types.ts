export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  MOBILE_PORTRAIT = "9:16",
  CINEMATIC = "16:9"
}

export enum ToolType {
  DASHBOARD = "dashboard",
  IMAGE_GEN = "image_gen",
  IMAGE_EDIT = "image_edit",
  VIDEO_GEN = "video_gen",
  COPY_WRITER = "copy_writer",
  LAYOUT_EDITOR = "layout_editor"
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'text';
  content: string; // URL or text content
  metadata?: {
    prompt: string;
    aspectRatio?: string;
  };
  createdAt: number;
}

export interface LayoutItem {
  id: string;
  type: 'image' | 'text' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  borderRadius?: number;
  style?: Record<string, string | number>;
  shapeType?: 'rectangle' | 'circle' | 'line'; // For shapes
  color?: string; // For shape background/border
}