"use client";

import React, { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  src: string;
  alt: string;
}

const galleryImages: GalleryImage[] = [
  {
    src: "/5.png",
    alt: "Properti 1",
  },
  {
    src: "/1.webp",
    alt: "Properti 2",
  },
  {
    src: "/4.jpg",
    alt: "Properti 3",
  },
  {
    src: "/6.jpg",
    alt: "Properti Unsplash",
  },
];

export default function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openImage = (index: number) => {
    setSelectedImage(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  return (
    <section className="bg-white py-16" id="gallery">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Galeri Alat Tulis</h2>
          <p className="text-gray-600 mt-4">
            Lihat beberapa alat tulis terbaik yang kami tawarkan.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="group cursor-pointer overflow-hidden rounded-lg shadow-md"
              onClick={() => openImage(index)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={600}
                height={400}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                unoptimized={image.src.startsWith("http")}
              />
            </div>
          ))}
        </div>
        {selectedImage !== null && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={closeImage}
          >
            <div className="relative max-w-4xl mx-auto">
              <button
                onClick={closeImage}
                className="absolute top-2 right-2 text-white text-2xl z-10"
              >
                &times;
              </button>
              <Image
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                width={800}
                height={600}
                className="w-full h-auto max-h-[70vh] object-contain"
                unoptimized={galleryImages[selectedImage].src.startsWith("http")}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
