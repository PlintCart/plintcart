import { useEffect, useRef, useState } from "react";

const phoneImages = [
  "/dashboard-phone.png",
  "/dashboard.png",
  "/product-phone.png",
  "/order-phone.png",
  "/stock-phone.png",
  "/analytics-phone.png",
  "/custom-phone.png"
];

export default function PhoneSlideshow() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % phoneImages.length);
    }, 1800);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index]);

  return (
    <img
      src={phoneImages[index]}
      alt="App screenshot"
      className="rounded-xl w-full h-auto object-cover transition-all duration-700"
      style={{ aspectRatio: "9/19" }}
    />
  );
}
