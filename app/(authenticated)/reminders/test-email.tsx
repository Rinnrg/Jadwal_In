"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Send, AlertCircle, CheckCircle2 } from "lucide-react"

export function TestEmailCard() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestEmail = async () => {
    if (!email) {
      setResult({ success: false, message: "Masukkan alamat email" })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/reminders/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ 
          success: false, 
          message: data.details ? `${data.error}\n${data.details}` : data.error 
        })
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: "Terjadi kesalahan saat mengirim email test" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Email Configuration
        </CardTitle>
        <CardDescription>
          Kirim email test untuk memverifikasi konfigurasi email Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Email Tujuan</Label>
          <div className="flex gap-2">
            <Input
              id="test-email"
              type="email"
              placeholder="contoh@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button 
              onClick={handleTestEmail}
              disabled={loading || !email}
            >
              {loading ? (
                "Mengirim..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim
                </>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className="whitespace-pre-line">
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Setup Email Configuration:</h4>
          <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Buka file <code>.env</code> di root project</li>
            <li>Tambahkan konfigurasi berikut:
              <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
{`EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"`}
              </pre>
            </li>
            <li>Untuk Gmail, buat App Password di: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google App Passwords</a></li>
            <li>Restart development server</li>
            <li>Test konfigurasi menggunakan form di atas</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
