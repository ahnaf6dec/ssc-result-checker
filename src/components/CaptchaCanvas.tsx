import React, { useCallback, useEffect, useRef } from 'react';
import { RefreshCwIcon } from 'lucide-react';
type CaptchaCanvasProps = {
  onCodeChange: (code: string) => void;
};
const characters = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
export function CaptchaCanvas({ onCodeChange }: CaptchaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const createCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const code = Array.from(
      {
        length: 5
      },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join('');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f0f0f0';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < 4; index += 1) {
      context.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.4)`;
      context.beginPath();
      context.moveTo(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
      context.lineTo(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
      context.stroke();
    }
    context.font = 'bold 22px Arial, sans-serif';
    context.textBaseline = 'middle';
    Array.from(code).forEach((character, index) => {
      const x = 15 + index * 24;
      const y = canvas.height / 2 + (Math.random() * 8 - 4);
      context.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
      context.save();
      context.translate(x, y);
      context.rotate((Math.random() * 30 - 15) * Math.PI / 180);
      context.fillText(character, 0, 0);
      context.restore();
    });
    onCodeChange(code);
  }, [onCodeChange]);
  useEffect(() => {
    createCaptcha();
  }, [createCaptcha]);
  return (
    <div className="flex items-center gap-1">
      <canvas
        ref={canvasRef}
        width="140"
        height="38"
        className="rounded border border-[#ccc] bg-[#f0f0f0]"
        aria-label="Security key image" />
      

      <button
        type="button"
        onClick={createCaptcha}
        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-green-700"
        aria-label="Refresh security key"
        title="Refresh CAPTCHA">
        
        <RefreshCwIcon className="h-4 w-4" />
      </button>
    </div>);

}