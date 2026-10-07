import { useState } from 'react';

// หน้าปกจากรูปที่ทำเอง (เช่น export จาก PowerPoint/Canva ขนาด 16:9) — ถ้าโหลดรูปไม่ได้จะใช้ปกเดิมแทน
export default function ImageCoverSlide({ src, fallback }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (failedSrc === src) return fallback;
  return (
    <div className="w-[1600px] h-[900px] bg-black flex items-center justify-center overflow-hidden">
      <img src={src} alt="หน้าปก" className="w-full h-full object-contain" referrerPolicy="no-referrer" onError={() => setFailedSrc(src)} />
    </div>
  );
}
