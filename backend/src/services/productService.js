import { env } from "../config/env.js";
import { NOTE_PRICE } from "../constants/business.js";
import { Product } from "../models/Product.js";
import { Purchase } from "../models/Purchase.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

const AI_MASTER_NOTES_NAME = "AI Master Notes";

const defaultChapterOutline = [
  "Introduction to AI and modern AI systems",
  "Machine learning basics",
  "Deep learning foundations",
  "Natural language processing and LLMs",
  "Prompt engineering and prompting patterns",
  "AI tools and practical workflows",
  "AI for students, creators, business, and coding",
  "AI ethics, safety, and limitations",
  "AI careers and future trends",
  "Revision chapters with key terms, MCQs, and short-answer practice"
];

const defaultHighlights = [
  "351-page exam-style PDF",
  "Worth Rs.5000, offered for just Rs.199",
  "Structured chapters with bullet notes and concept summaries",
  "Revision questions, MCQs, and probable viva topics",
  "Designed for self-study and quick revision"
];

function buildAiMasterNotesPayload() {
  return {
    name: AI_MASTER_NOTES_NAME,
    price: NOTE_PRICE,
    category: "AI",
    accessType: "download",
    isActive: true,
    description: "A premium exam-style AI notes PDF for study, revision, and concept building.",
    downloadUrl: env.aiNotesPdfUrl,
    fileVersion: env.aiNotesPdfVersion,
    fileSizeLabel: env.aiNotesPdfFileSizeLabel,
    highlights: defaultHighlights,
    chapterOutline: defaultChapterOutline
  };
}

function sanitizeProduct(product, { includeDownload = false } = {}) {
  if (!product) {
    return null;
  }

  return {
    _id: product._id,
    name: product.name,
    price: product.price,
    category: product.category,
    accessType: product.accessType,
    isActive: product.isActive,
    description: product.description || "",
    fileVersion: product.fileVersion || "",
    fileSizeLabel: product.fileSizeLabel || "",
    highlights: product.highlights || [],
    chapterOutline: product.chapterOutline || [],
    downloadReady: Boolean(product.downloadUrl),
    ...(includeDownload ? { downloadUrl: product.downloadUrl || "" } : {})
  };
}

export async function ensureProductsSeeded() {
  const aiProductPayload = buildAiMasterNotesPayload();
  const existingProducts = await Product.find({}).sort({ createdAt: 1 });

  let aiProduct = existingProducts.find((product) => product.name === AI_MASTER_NOTES_NAME);

  if (!aiProduct) {
    aiProduct = await Product.create(aiProductPayload);
  } else {
    aiProduct.name = aiProductPayload.name;
    aiProduct.price = aiProductPayload.price;
    aiProduct.category = aiProductPayload.category;
    aiProduct.accessType = aiProductPayload.accessType;
    aiProduct.isActive = aiProductPayload.isActive;
    aiProduct.description = aiProductPayload.description;
    aiProduct.highlights = aiProductPayload.highlights;
    aiProduct.chapterOutline = aiProductPayload.chapterOutline;

    if (aiProductPayload.downloadUrl) {
      aiProduct.downloadUrl = aiProductPayload.downloadUrl;
    }
    if (aiProductPayload.fileVersion) {
      aiProduct.fileVersion = aiProductPayload.fileVersion;
    }
    if (aiProductPayload.fileSizeLabel) {
      aiProduct.fileSizeLabel = aiProductPayload.fileSizeLabel;
    }

    await aiProduct.save();
  }

  const legacyProductNames = new Set(["Academic Notes", "Coding Notes", "Exam Notes"]);
  const legacyIds = existingProducts
    .filter((product) => legacyProductNames.has(product.name) && product.isActive)
    .map((product) => product._id);

  if (legacyIds.length) {
    await Product.updateMany({ _id: { $in: legacyIds } }, { $set: { isActive: false } });
  }

  return aiProduct;
}

export async function getActiveProducts({ includeDownload = false } = {}) {
  const aiProduct = await ensureProductsSeeded();
  return [sanitizeProduct(aiProduct.toObject ? aiProduct.toObject() : aiProduct, { includeDownload })];
}

export async function getProductById(productId, { includeDownload = false } = {}) {
  await ensureProductsSeeded();
  const product = await Product.findOne({ _id: productId, isActive: true });
  return includeDownload ? product : sanitizeProduct(product?.toObject ? product.toObject() : product);
}

export async function getDefaultProduct({ includeDownload = false } = {}) {
  const product = await ensureProductsSeeded();
  return includeDownload ? product : sanitizeProduct(product.toObject ? product.toObject() : product);
}

export function serializePurchasedProduct(product) {
  return sanitizeProduct(product, { includeDownload: false });
}

export async function getAuthorizedDownloadProduct({ telegramId, productId }) {
  await ensureProductsSeeded();

  const user = await User.findOne({ telegramId: String(telegramId) }).select("_id");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.downloadUrl) {
    throw new AppError("Download is not ready yet", 409);
  }

  const purchase = await Purchase.findOne({
    user: user._id,
    product: product._id,
    status: "approved"
  }).select("_id");

  if (!purchase) {
    throw new AppError("Purchase required to access this download", 403);
  }

  return product;
}
