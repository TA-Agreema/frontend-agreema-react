import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"

const formSchema = z.object({
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi").min(6, "Password minimal 6 karakter"),
})

export default function UserAuthForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const navigate = useNavigate()
    const { login } = useAuth()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        setError("")

        try {
            await login(data.email, data.password)
            navigate("/dashboard")
        } catch (err) {
            console.error("Login error:", err)
            setError("Email atau password salah. Silakan coba lagi.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="nama@perusahaan.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Masukkan password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="mt-2 w-full flex items-center justify-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                    {isLoading ? "Memproses..." : "Masuk"}
                </Button>
            </form>
        </Form>
    )
}
