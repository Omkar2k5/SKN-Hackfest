"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, FileUp, Upload } from "lucide-react"
import { extractTextFromPDF } from "@/lib/pdf-extractor"
import { parseKotakStatement } from "@/lib/statement-parser"
import { Transaction, StatementParsingResult } from "@/lib/types"

// Simple placeholder auth hook - replace with your actual auth hook
const useAuth = () => {
  // In a real app, this would come from your authentication system
  return {
    user: { uid: 'demo-user' } // Placeholder user
  }
}

export function ImportTransactions() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<StatementParsingResult | null>(null)
  const { user } = useAuth() // Get current user

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    
    // Reset states when a new file is selected
    setText("")
    setError(null)
    setSuccess(null)
    setParseResult(null)
  }

  // Handle PDF import
  const handlePdfImport = async () => {
    if (!file) {
      setError("Please select a PDF file first")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file)
      
      // Set the extracted text
      setText(extractedText)
      
      // Process the statement using Kotak parser
      const result = await parseKotakStatement(extractedText, user?.uid)
      
      setParseResult(result)
      
      if (result.success) {
        setSuccess(`Successfully processed statement with ${result.transactions?.length || 0} transactions`)
      } else {
        setError(`Failed to parse statement: ${result.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error("Error processing PDF:", err)
      setError("Failed to process PDF. " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  // Handle text import (if user pastes text directly)
  const handleTextImport = async () => {
    if (!text.trim()) {
      setError("Please enter or paste some text first")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Process the statement using Kotak parser
      const result = await parseKotakStatement(text, user?.uid)
      
      setParseResult(result)
      
      if (result.success) {
        setSuccess(`Successfully processed statement with ${result.transactions?.length || 0} transactions`)
      } else {
        setError(`Failed to parse statement: ${result.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error("Error processing text:", err)
      setError("Failed to process text. " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Bank Statement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input Section */}
        <div className="space-y-2">
          <label htmlFor="pdf-upload" className="block text-sm font-medium">
            Upload Kotak Mahindra Bank Statement PDF
          </label>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => document.getElementById("pdf-upload")?.click()}
              className="w-full justify-start"
            >
              <FileUp className="mr-2 h-4 w-4" />
              {file ? file.name : "Select PDF file"}
            </Button>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button 
              onClick={handlePdfImport}
              disabled={!file || loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import PDF
            </Button>
          </div>
        </div>

        {/* Text Input Section */}
        <div className="space-y-2">
          <label htmlFor="statement-text" className="block text-sm font-medium">
            Or Paste Statement Text
          </label>
          <Textarea
            id="statement-text"
            placeholder="Paste your bank statement text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Statement Summary */}
        {parseResult?.statement && (
          <div className="border rounded-md p-4 space-y-3">
            <h3 className="font-medium">Statement Summary</h3>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Account Number</p>
                <p className="font-medium">{parseResult.statement.accountNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer Name</p>
                <p className="font-medium">{parseResult.statement.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Period</p>
                <p className="font-medium">
                  {format(parseResult.statement.period.from, 'dd/MM/yyyy')} - 
                  {format(parseResult.statement.period.to, 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Closing Balance</p>
                <p className="font-medium">₹{parseResult.statement.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            
            <div className="pt-2">
              <h4 className="font-medium">Transaction Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <div>
                  <p className="text-muted-foreground">Total Debits</p>
                  <p className="font-medium text-rose-600">
                    {parseResult.statement.withdrawalCount} transactions | 
                    ₹{parseResult.statement.totalWithdrawal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Credits</p>
                  <p className="font-medium text-emerald-600">
                    {parseResult.statement.depositCount} transactions | 
                    ₹{parseResult.statement.totalDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Preview of first few transactions */}
        {parseResult?.transactions && parseResult.transactions.length > 0 && (
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Transaction Preview</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {parseResult.transactions.slice(0, 5).map((tx, index) => (
                <div key={index} className="text-sm border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{tx.merchantName}</span>
                    <span className={tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {tx.amount >= 0 ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(tx.timestamp), 'dd/MM/yyyy')}</span>
                    <span>{tx.transactionMode}</span>
                  </div>
                </div>
              ))}
              {parseResult.transactions.length > 5 && (
                <div className="text-center text-sm text-muted-foreground pt-2">
                  ... and {parseResult.transactions.length - 5} more transactions
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTextImport} 
          disabled={!text.trim() || loading}
          className="w-full"
        >
          Process Statement Text
        </Button>
      </CardFooter>
    </Card>
  )
} 