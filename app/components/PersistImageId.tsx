"use client";

import { useEffect } from "react";

export default function PersistImageId({ imageId }: { imageId: string }) {
  useEffect(() => {
    localStorage.setItem("lastImageId", imageId);
  }, [imageId]);

  return null;
}
