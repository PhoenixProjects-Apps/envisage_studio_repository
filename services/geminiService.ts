import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

// Helper to get API key safely
const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Copy Generation ---
export const generateMarketingCopy = async (
  topic: string,
  type: string,
  brandVoice: string
): Promise<string> => {
  const client = getClient();
  const prompt = `Write a ${type} about ${topic}. The brand voice is ${brandVoice}. Keep it engaging and professional.`;
  
  const response: GenerateContentResponse = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "No content generated.";
};

// --- Image Generation ---
export const generateMarketingImage = async (
  prompt: string,
  aspectRatio: string
): Promise<string> => {
  const client = getClient();
  // We use gemini-2.5-flash-image which supports standard generation
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        // imageSize is only supported in pro-image
      }
    }
  });

  // Extract image
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error("No image generated in response.");
};

// --- Image Editing ---
export const editMarketingImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  const client = getClient();
  // Remove data URL prefix if present for the API call
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png' // Assuming png or converts gracefully, usually safe for general base64
          }
        },
        { text: prompt }
      ]
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("Failed to edit image.");
};

// --- Video Generation ---
export const generateMarketingVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  imageInput?: string // Base64 Data URL
): Promise<string> => {
  // Ensure we use a fresh client to pick up any new keys if re-selected
  const client = getClient();
  const apiKey = process.env.API_KEY || '';
  
  let operation;
  
  if (imageInput) {
    // Image-to-Video
    const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageInput.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    operation = await client.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Animate this image", 
      image: {
        imageBytes: base64Data,
        mimeType: mimeType
      },
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio,
        resolution: '720p'
      }
    });
  } else {
    // Text-to-Video
    operation = await client.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio,
        resolution: '720p'
      }
    });
  }

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await client.operations.getVideosOperation({ operation: operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Video generation failed or returned no URI.");

  // Construct the download URL safely
  const separator = uri.includes('?') ? '&' : '?';
  const downloadUrl = `${uri}${separator}key=${encodeURIComponent(apiKey)}`;

  // Fetch the actual video content
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }

  const rawBlob = await response.blob();
  // Force mime type to video/mp4 to ensure data URI is correct for playback
  const blob = new Blob([rawBlob], { type: 'video/mp4' });
  
  // Convert Blob to Base64 Data URL so it plays immediately in the video tag
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert video to Data URL"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- 3D Animation Generation ---
export const generateThreeDAnimation = async (
  prompt: string,
  style: string
): Promise<string> => {
  // We use the video model but with specialized prompting for 3D styling
  const fullPrompt = `Create a high-quality 3D animated video. Style: ${style}. Details: ${prompt}. The output must look like a professional 3D render from Unreal Engine 5 or Blender. Cinematic lighting, high fidelity texture.`;
  
  return generateMarketingVideo(fullPrompt, '16:9');
};