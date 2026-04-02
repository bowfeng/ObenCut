import type { EditorCore } from "@/core";
import type { MediaAsset } from "@/types/assets";
import { storageService } from "@/services/storage/service";
import { generateUUID } from "@/utils/id";
import { videoCache } from "@/services/video-cache/service";
import { hasMediaId } from "@/lib/timeline/element-utils";

export class MediaManager {
	private assets: MediaAsset[] = [];
	private isLoading = false;
	private listeners = new Set<() => void>();

	constructor(private editor: EditorCore) {}

	async addMediaAsset({
		projectId,
		asset,
	}: {
		projectId: string;
		asset: MediaAsset & { id?: string };
	}): Promise<void> {
		const newAsset: MediaAsset = {
			...asset,
			id: asset.id || generateUUID(),
		};
		// 如果是 Data URL 格式的 File，设置 url 和 thumbnailUrl
		if (asset.file) {
			const dataUrl = await this.readFileAsDataURL(asset.file);
			if (dataUrl) {
				newAsset.url = dataUrl;
				newAsset.thumbnailUrl = dataUrl;
			}
		}

		this.assets = [...this.assets, newAsset];
		this.notify();

		try {
			await storageService.saveMediaAsset({ projectId, mediaAsset: newAsset });
		} catch (error) {
			console.error("Failed to save media asset:", error);
			this.assets = this.assets.filter((asset) => asset.id !== newAsset.id);
			this.notify();
		}
	}

	/**
	 * 尝试从 File 对象读取 Data URL
	 * 支持 data:image/png;base64,...格式的 File
	 */
	private async readFileAsDataURL(file: File): Promise<string | null> {
		try {
			const text = await file.text();
			// 检查是否是 Data URL 格式
			if (text.startsWith("data:")) {
				return text;
			}
			return null;
		} catch {
			return null;
		}
	}

	async removeMediaAsset({
		projectId,
		id,
	}: {
		projectId: string;
		id: string;
	}): Promise<void> {
		const asset = this.assets.find((asset) => asset.id === id);

		videoCache.clearVideo({ mediaId: id });

		if (asset?.url) {
			URL.revokeObjectURL(asset.url);
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		}

		this.assets = this.assets.filter((asset) => asset.id !== id);
		this.notify();

		const tracks = this.editor.timeline.getTracks();
		const elementsToRemove: Array<{ trackId: string; elementId: string }> = [];

		for (const track of tracks) {
			for (const element of track.elements) {
				if (hasMediaId(element) && element.mediaId === id) {
					elementsToRemove.push({ trackId: track.id, elementId: element.id });
				}
			}
		}

		if (elementsToRemove.length > 0) {
			this.editor.timeline.deleteElements({ elements: elementsToRemove });
		}

		try {
			await storageService.deleteMediaAsset({ projectId, id });
		} catch (error) {
			console.error("Failed to delete media asset:", error);
		}
	}

	async updateMediaAsset({
		projectId,
		id,
		name,
	}: {
		projectId: string;
		id: string;
		name: string;
	}): Promise<void> {
		// 更新本地状态
		const assetIndex = this.assets.findIndex((asset) => asset.id === id);
		if (assetIndex !== -1) {
			const updatedAssets = [...this.assets];
			updatedAssets[assetIndex] = {
				...updatedAssets[assetIndex],
				name,
			};
			this.assets = updatedAssets;
			this.notify();
		}

		// 更新存储
		try {
			await storageService.updateMediaAsset({ projectId, id, name });
		} catch (error) {
			console.error("Failed to update media asset name:", error);
		}
	}

	async loadProjectMedia({ projectId }: { projectId: string }): Promise<void> {
		this.isLoading = true;
		this.notify();

		try {
			const mediaAssets = await storageService.loadAllMediaAssets({
				projectId,
			});
			this.assets = mediaAssets;
			this.notify();
		} catch (error) {
			console.error("Failed to load media assets:", error);
		} finally {
			this.isLoading = false;
			this.notify();
		}
	}

	async clearProjectMedia({ projectId }: { projectId: string }): Promise<void> {
		this.assets.forEach((asset) => {
			if (asset.url) {
				URL.revokeObjectURL(asset.url);
			}
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		});

		const mediaIds = this.assets.map((asset) => asset.id);
		this.assets = [];
		this.notify();

		try {
			await Promise.all(
				mediaIds.map((id) =>
					storageService.deleteMediaAsset({ projectId, id }),
				),
			);
		} catch (error) {
			console.error("Failed to clear media assets from storage:", error);
		}
	}

	clearAllAssets(): void {
		videoCache.clearAll();

		this.assets.forEach((asset) => {
			if (asset.url) {
				URL.revokeObjectURL(asset.url);
			}
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		});

		this.assets = [];
		this.notify();
	}

	getAssets(): MediaAsset[] {
		return this.assets;
	}

	/**
	 * 根据 ID 获取媒体资产
	 */
	getMediaById(id: string): MediaAsset | undefined {
		return this.assets.find((asset) => asset.id === id);
	}

	setAssets({ assets }: { assets: MediaAsset[] }): void {
		this.assets = assets;
		this.notify();
	}

	isLoadingMedia(): boolean {
		return this.isLoading;
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		this.listeners.forEach((fn) => fn());
	}
}
