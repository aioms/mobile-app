import { useLayoutEffect, useRef, useState } from "react";
import OrderDocument, { DocumentProps } from "./OrderDocument";

export default function DocumentPreview(props: DocumentProps) {
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, height: 0 });
  useLayoutEffect(() => {
    const outer = container.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const update = () => {
      const scale = Math.min(1, outer.clientWidth / inner.offsetWidth);
      setSize({ scale, height: inner.offsetHeight * scale });
    };
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    update();
    return () => observer.disconnect();
  }, [props]);
  return (
    <div
      ref={container}
      style={{
        width: "100%",
        height: size.height || "auto",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: props.kind === "quotation" ? 720 : 300,
          margin: "0 auto",
          transform: `scale(${size.scale})`,
          transformOrigin: "top left",
        }}
      >
        <OrderDocument ref={content} {...props} />
      </div>
    </div>
  );
}
