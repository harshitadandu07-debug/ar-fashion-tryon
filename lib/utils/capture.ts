export async function captureElementToBlob(el: HTMLElement): Promise<Blob> {
  // MVP placeholder: we’ll implement via canvas capture (WebGL canvas or video + overlay).
  // The final implementation depends on how MindAR renders (canvas element access).
  throw new Error(`captureElementToBlob not implemented yet for: ${el.tagName}`);
}

export async function shareOrDownloadBlob(args: {
  blob: Blob;
  filename: string;
}): Promise<"shared" | "downloaded"> {
  const file = new File([args.blob], args.filename, { type: args.blob.type });
  // @ts-expect-error - navigator.canShare not in all TS libs by default
  const canShare = typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] });

  if (typeof navigator !== "undefined" && "share" in navigator && canShare) {
    // @ts-expect-error - narrow share typing
    await navigator.share({ files: [file], title: "Double Take" });
    return "shared";
  }

  const url = URL.createObjectURL(args.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = args.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}

