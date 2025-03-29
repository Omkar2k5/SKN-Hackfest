"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the component with SSR disabled
const ImportTransactions = dynamic(
  () => import("@/components/import-transactions").then((mod) => mod.ImportTransactions),
  { 
    ssr: false,  // Disable SSR for this component
    loading: () => (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
)

export default function ImportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Import Bank Statement</h1>
        <p className="text-muted-foreground mb-6">
          Upload your Kotak Mahindra Bank statement (PDF) or paste the statement text below to import your transactions.
          Your imported transactions will be available in your transaction history.
        </p>
        
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <ImportTransactions />
        </Suspense>
      </div>
    </div>
  )
} 