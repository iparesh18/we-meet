import { VideoPresets, ScreenSharePresets } from 'livekit-client';

/**
 * Shared LiveKit Room options so the host and students use the *same* media
 * quality settings. Kept intentionally conservative so weak connections still
 * work — every bitrate here is a ceiling, not a target floor, and
 * adaptiveStream + dynacast + simulcast scale things down automatically when
 * bandwidth or CPU is tight.
 *
 * Camera:      ~720p @ 30fps, capped at 2.5 Mbps.
 * Screen share: sharp/readable text, 720p→1080p @ 15fps, capped at 4.5 Mbps.
 *
 * Property names verified against livekit-client 2.x (RoomOptions /
 * TrackPublishDefaults).
 */
export function getLiveKitRoomOptions() {
  return {
    // Subscriber-side: automatically pick a layer that fits the visible video
    // element + available bandwidth (and pause hidden ones).
    adaptiveStream: true,
    // Publisher-side: pause simulcast layers nobody is watching.
    dynacast: true,

    // Capture the camera at 720p by default.
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },

    publishDefaults: {
      // Publish multiple resolutions so each subscriber gets an appropriate one.
      simulcast: true,
      // VP8 — broadest browser compatibility for an online class.
      videoCodec: 'vp8',

      // Camera: target 720p30, ceiling ~2.5 Mbps.
      videoEncoding: {
        maxBitrate: 2_500_000,
        maxFramerate: 30,
      },

      // Screen share: prioritise readable text/slides over motion smoothness.
      // 15fps keeps bitrate spent on sharpness; ceiling ~4.5 Mbps.
      screenShareEncoding: {
        maxBitrate: 4_500_000,
        maxFramerate: 15,
      },

      // Offer a 720p and a 1080p layer for screen share (lowest→highest).
      // Not forcing 4K keeps weak networks safe.
      screenShareSimulcastLayers: [
        ScreenSharePresets.h720fps15,
        ScreenSharePresets.h1080fps15,
      ],
    },
  };
}

/** Ready-made options object for `<LiveKitRoom options={roomOptions} />`. */
export const roomOptions = getLiveKitRoomOptions();
