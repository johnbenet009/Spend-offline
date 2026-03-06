import { toPng } from 'html-to-image';

export async function downloadNodeAsImage(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, { backgroundColor: '#ffffff', pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
