import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #17355c 0%, #3d7394 48%, #b9d8e4 100%)", color: "white", fontSize: 212, fontWeight: 700, fontFamily: "Georgia" }}>N<span style={{ fontSize: 125, marginLeft: 8 }}>✈</span></div>, size);
}
