import { describe, expect, it } from "vitest";
import { isYoutubeShort, youtubeEmbedUrl, youtubeId, youtubeThumbnail } from "@/lib/video";

describe("youtubeId — links pasted from YouTube's Share button", () => {
  it("reads Shorts, youtu.be, watch and embed links (tracking parameters included)", () => {
    expect(youtubeId("https://youtube.com/shorts/BZpXmItpFCs?si=_r7A_fPZJi7v50yL")).toBe("BZpXmItpFCs");
    expect(youtubeId("https://youtu.be/jK_s_YOa1ro?si=mNu92H8cmKAWbad5")).toBe("jK_s_YOa1ro");
    expect(youtubeId("https://www.youtube.com/watch?v=jK_s_YOa1ro&t=12s")).toBe("jK_s_YOa1ro");
    expect(youtubeId("https://www.youtube-nocookie.com/embed/jK_s_YOa1ro")).toBe("jK_s_YOa1ro");
  });

  it("returns null for a video file, another site or a malformed link", () => {
    expect(youtubeId("https://cdn.example.com/demo.mp4")).toBeNull();
    expect(youtubeId("https://vimeo.com/123456")).toBeNull();
    expect(youtubeId("https://youtu.be/short")).toBeNull();
    expect(youtubeId("pas une adresse")).toBeNull();
  });

  it("frames Shorts in portrait only", () => {
    expect(isYoutubeShort("https://youtube.com/shorts/BZpXmItpFCs")).toBe(true);
    expect(isYoutubeShort("https://youtu.be/jK_s_YOa1ro")).toBe(false);
  });

  it("builds the privacy-friendly player and thumbnail addresses", () => {
    expect(youtubeEmbedUrl("jK_s_YOa1ro", { autoplay: true })).toBe(
      "https://www.youtube-nocookie.com/embed/jK_s_YOa1ro?rel=0&modestbranding=1&autoplay=1"
    );
    expect(youtubeThumbnail("jK_s_YOa1ro")).toBe("https://i.ytimg.com/vi/jK_s_YOa1ro/hqdefault.jpg");
  });
});
