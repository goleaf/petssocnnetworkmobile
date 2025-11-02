import type { Product, Recall } from "./types"
import { readData, writeData } from "./storage"

const STORAGE_KEYS = {
  PRODUCTS: "pet_social_products",
  RECALLS: "pet_social_recalls",
} as const

// Product Functions
export function getProducts(): Product[] {
  return readData<Product[]>(STORAGE_KEYS.PRODUCTS, [])
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return getProducts().filter((p) => p.category === category)
}

export function getRecalledProducts(): Product[] {
  return getProducts().filter((p) => p.isRecalled)
}

export function addProduct(product: Product): void {
  const products = getProducts()
  products.push(product)
  writeData(STORAGE_KEYS.PRODUCTS, products)
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData(STORAGE_KEYS.PRODUCTS, products)
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts()
  const filtered = products.filter((p) => p.id !== id)
  writeData(STORAGE_KEYS.PRODUCTS, filtered)
}

// Recall Functions
export function getRecalls(): Recall[] {
  return readData<Recall[]>(STORAGE_KEYS.RECALLS, [])
}

export function getRecallById(id: string): Recall | undefined {
  return getRecalls().find((r) => r.id === id)
}

export function getRecallsByProduct(productId: string): Recall[] {
  return getRecalls().filter((r) => r.affectedProductIds.includes(productId))
}

export function addRecall(recall: Recall): void {
  const recalls = getRecalls()
  recalls.push(recall)
  writeData(STORAGE_KEYS.RECALLS, recalls)
  
  // Update affected products to mark them as recalled
  const products = getProducts()
  recall.affectedProductIds.forEach((productId) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      updateProduct(productId, {
        isRecalled: true,
        recallId: recall.id,
        recallNotice: recall.description,
      })
    }
  })
}

export function updateRecall(id: string, updates: Partial<Recall>): void {
  const recalls = getRecalls()
  const index = recalls.findIndex((r) => r.id === id)
  if (index !== -1) {
    const oldRecall = recalls[index]
    recalls[index] = {
      ...recalls[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    writeData(STORAGE_KEYS.RECALLS, recalls)
    
    // If affected products changed, update product recall status
    if (updates.affectedProductIds) {
      const allProducts = getProducts()
      
      // Remove recall from products no longer affected
      oldRecall.affectedProductIds
        .filter((pid) => !updates.affectedProductIds!.includes(pid))
        .forEach((productId) => {
          updateProduct(productId, {
            isRecalled: false,
            recallId: undefined,
            recallNotice: undefined,
          })
        })
      
      // Add recall to newly affected products
      updates.affectedProductIds
        .filter((pid) => !oldRecall.affectedProductIds.includes(pid))
        .forEach((productId) => {
          updateProduct(productId, {
            isRecalled: true,
            recallId: id,
            recallNotice: updates.description || oldRecall.description,
          })
        })
      
      // Update existing affected products if description changed
      if (updates.description) {
        updates.affectedProductIds.forEach((productId) => {
          updateProduct(productId, {
            recallNotice: updates.description,
          })
        })
      }
    } else if (updates.description) {
      // Update description for all affected products
      oldRecall.affectedProductIds.forEach((productId) => {
        updateProduct(productId, {
          recallNotice: updates.description,
        })
      })
    }
  }
}

export function deleteRecall(id: string): void {
  const recall = getRecallById(id)
  if (recall) {
    // Remove recall from affected products
    recall.affectedProductIds.forEach((productId) => {
      updateProduct(productId, {
        isRecalled: false,
        recallId: undefined,
        recallNotice: undefined,
      })
    })
  }
  
  const recalls = getRecalls()
  const filtered = recalls.filter((r) => r.id !== id)
  writeData(STORAGE_KEYS.RECALLS, filtered)
}

