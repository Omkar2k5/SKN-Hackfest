"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { IndianRupee, Upload, Loader2 } from "lucide-react"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { format } from "date-fns"
import { extractTextFromPDF, extractTransactions, type Transaction } from "@/lib/pdf-extractor"
import Script from 'next/script'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardNav } from "@/components/dashboard-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UpdateTransactionsPage() {
  const [mounted, setMounted] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [extractedTransactions, setExtractedTransactions] = useState<Transaction[]>([])
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false)
  const [tesseractLoaded, setTesseractLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setExtractedTransactions([])
      setExtractedText("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    if (!pdfJsLoaded) {
      setError('PDF.js is still loading. Please wait a moment and try again.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Extract text from PDF
      const text = await extractTextFromPDF(file)
      setExtractedText(text)
      console.log('Extracted text:', text) // Debug log
      
      // Extract transactions from text
      const transactions = extractTransactions(text)
      console.log('Extracted transactions:', transactions) // Debug log
      
      setExtractedTransactions(transactions)

      if (transactions.length === 0) {
        setError('No transactions found in the PDF. Please make sure you uploaded a valid bank statement.')
        setIsLoading(false)
        return
      }

      // Store transactions in Firestore
      const transactionsRef = collection(firestore, 'transactions')
      
      const promises = transactions.map(async (transaction) => {
        // Create a transaction document with the specified format
        const transactionData = {
          date: format(transaction.timestamp, 'dd-MM-yyyy'),
          type: transaction.transactionMode,
          merchantName: transaction.merchantName,
          transactionId: Math.random().toString().substring(2, 14), // 12-digit transaction ID
          amount: Math.abs(transaction.amount).toFixed(2),
          isCredit: transaction.amount > 0,
          timestamp: Timestamp.fromDate(new Date(transaction.timestamp)),
          uploadedAt: Timestamp.now(),
          ...(transaction.upiId && { upiId: transaction.upiId }),
          ...(transaction.accountNumber && { accountNumber: transaction.accountNumber })
        }

        // Add the document to Firestore
        return addDoc(transactionsRef, transactionData)
      })

      await Promise.all(promises)
      setSuccess(`Successfully uploaded ${transactions.length} transactions to Firestore!`)
    } catch (err) {
      console.error('Error processing file:', err)
      setError(err instanceof Error ? err.message : 'Failed to process the PDF file')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Load scripts */}
      <Script 
        src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={() => setPdfJsLoaded(true)}
      />
      <Script 
        src="//cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js"
        onLoad={() => setTesseractLoaded(true)}
      />
      
      <div className="flex min-h-screen flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Link href="/home" className="flex items-center gap-2">
              <IndianRupee className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">FinanceBuddy</span>
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <img
                  src="/placeholder.svg?height=32&width=32"
                  width={32}
                  height={32}
                  alt="Avatar"
                  className="rounded-full"
                />
                <span>John Doe</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid flex-1 md:grid-cols-[240px_1fr]">
          <DashboardNav className="hidden border-r md:block" />
          <main className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Update Transactions</h1>
                <p className="text-muted-foreground">Upload your bank statement in PDF format to automatically extract and update transactions using OCR</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Upload Bank Statement</CardTitle>
                <CardDescription>
                  Select your bank statement PDF file to automatically extract and update transactions using OCR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="file">Bank Statement (PDF)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="flex-1"
                        disabled={isLoading || !pdfJsLoaded}
                      />
                    </div>
                    {file && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {file.name}
                      </p>
                    )}
                    {(!pdfJsLoaded || !tesseractLoaded) && (
                      <p className="text-sm text-muted-foreground">
                        Loading processors... {pdfJsLoaded ? '✓' : '⏳'} PDF.js {tesseractLoaded ? '✓' : '⏳'} OCR
                      </p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-50 text-green-700 border-green-200">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={!file || isLoading || !pdfJsLoaded} 
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload and Process
                      </>
                    )}
                  </Button>
                </form>

                {extractedTransactions.length > 0 && (
                  <div className="mt-6">
                    <Tabs defaultValue="transactions">
                      <TabsList className="mb-4">
                        <TabsTrigger value="transactions">Extracted Transactions</TabsTrigger>
                        <TabsTrigger value="rawtext">Raw Text</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="transactions">
                        <h3 className="text-lg font-semibold mb-2">Extracted Transactions</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {extractedTransactions.map((transaction, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between">
                                <span className="font-medium">{transaction.merchantName}</span>
                                <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                                  ₹{Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                <div>{format(transaction.timestamp, 'dd MMM yyyy')}</div>
                                <div>Mode: {transaction.transactionMode}</div>
                                {transaction.upiId && <div>UPI ID: {transaction.upiId}</div>}
                                {transaction.accountNumber && <div>Account: {transaction.accountNumber}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="rawtext">
                        <h3 className="text-lg font-semibold mb-2">Extracted Text</h3>
                        <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
                          {extractedText || "No text extracted yet"}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  )
} 