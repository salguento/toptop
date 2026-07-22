type ActionResult =
  | "saved"
  | "shared"
  | "cancelled"
  | "failed"
  | "unsupported";

type SaveFileHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: unknown) => Promise<SaveFileHandle>;
};

type GeneratedImageActionsOptions = {
  getFileName: () => string;
  notify: (message: string) => void;
};

const useGeneratedImageActions = ({
  getFileName,
  notify,
}: GeneratedImageActionsOptions) => {
  const imageUrl = ref("");
  let imageBlob: Blob | null = null;
  let objectUrl = "";

  const imageReady = computed(() => Boolean(imageBlob && objectUrl));

  const clearGeneratedImage = () => {
    imageBlob = null;
    imageUrl.value = "";
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  };

  const setGeneratedImage = (blob: Blob, url: string) => {
    if (objectUrl && objectUrl !== url) URL.revokeObjectURL(objectUrl);
    imageBlob = blob;
    objectUrl = url;
    imageUrl.value = url;
  };

  const getGeneratedImageFile = () => {
    if (!imageBlob || typeof File !== "function") return null;

    return new File([imageBlob], getFileName(), {
      type: "image/png",
      lastModified: Date.now(),
    });
  };

  const canShareImageFile = (file: File | null) => {
    try {
      return Boolean(
        file &&
          typeof navigator.share === "function" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] }),
      );
    } catch {
      return false;
    }
  };

  const shareImageFile = async (file: File | null): Promise<ActionResult> => {
    if (!file || !canShareImageFile(file)) return "unsupported";

    try {
      await navigator.share({
        files: [file],
        title: "My Toptop",
        text: "My listening stats on Toptop",
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      return "failed";
    }
  };

  const saveImageWithFilePicker = async (
    suggestedName: string,
    blob: Blob,
  ): Promise<ActionResult> => {
    const browserWindow = window as SaveFilePickerWindow;
    if (!browserWindow.showSaveFilePicker) return "unsupported";

    try {
      const fileHandle = await browserWindow.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: "PNG image",
            accept: { "image/png": [".png"] },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      return "failed";
    }
  };

  const downloadGeneratedImage = (fileName: string) => {
    if (!imageBlob || !objectUrl) return false;

    try {
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = fileName;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      return true;
    } catch {
      return false;
    }
  };

  const saveGeneratedImage = async () => {
    const blob = imageBlob;
    if (!imageReady.value || !blob) {
      notify("Image is not ready yet");
      return;
    }

    const file = getGeneratedImageFile();
    const fileName = file?.name ?? getFileName();
    const saveResult = await saveImageWithFilePicker(fileName, blob);
    if (saveResult === "saved") {
      notify("Image saved");
      return;
    }
    if (saveResult === "cancelled") return;

    const shareResult = await shareImageFile(file);
    if (shareResult === "shared") {
      notify("Opened device share options");
      return;
    }
    if (shareResult === "cancelled") return;

    if (downloadGeneratedImage(fileName)) {
      notify("PNG download started");
      return;
    }

    notify("Unable to save the image. Please try again.");
  };

  const copyGeneratedImage = async () => {
    if (!imageReady.value || !imageBlob) {
      notify("Image is not ready yet");
      return;
    }

    const file = getGeneratedImageFile();
    try {
      if (
        typeof ClipboardItem !== "function" ||
        typeof navigator.clipboard?.write !== "function"
      ) {
        throw new Error("Clipboard API not supported");
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": imageBlob }),
      ]);
      notify("Image copied");
    } catch {
      const shareResult = await shareImageFile(file);
      if (shareResult === "shared") {
        notify("Clipboard unavailable; opened share options");
      } else if (shareResult !== "cancelled") {
        notify("This browser cannot copy images");
      }
    }
  };

  onScopeDispose(clearGeneratedImage);

  return {
    imageReady,
    imageUrl,
    clearGeneratedImage,
    copyGeneratedImage,
    saveGeneratedImage,
    setGeneratedImage,
  };
};

export default useGeneratedImageActions;
