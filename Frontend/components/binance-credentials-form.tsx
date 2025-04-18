import { useState } from "react"
import { getDatabase, ref, set } from "firebase/database"
import { getAuth } from "firebase/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BinanceCredentialsFormProps {
  onSuccess: () => void;
}

export function BinanceCredentialsForm({ onSuccess }: BinanceCredentialsFormProps) {
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("No user logged in")

      const db = getDatabase()
      await set(ref(db, `users/${user.uid}/binance_credentials`), {
        apiKey,
        apiSecret,
        updatedAt: Date.now()
      })

      onSuccess()
    } catch (err: any) {
      console.error("Error saving credentials:", err)
      setError(err.message || "Failed to save credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Binance API Credentials</CardTitle>
        <CardDescription>
          Enter your Binance API credentials to view your portfolio. Your credentials are securely stored and encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="text-center">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-center block">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Binance API key"
              required
              className="text-center"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret" className="text-center block">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your Binance API secret"
              required
              className="text-center"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Credentials"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 