import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
  rememberMe: z.boolean(),
});

export default function UserAuthForm({
  successMessage,
}: {
  successMessage?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError("");

    try {
      await login(data.email, data.password, data.rememberMe);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Email atau password salah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </div>
        )}
        {successMessage && !error && (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[15px] font-medium text-[#64708b]">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="nama@perusahaan.com"
                  className="h-[35px] rounded-[5px] border-[#dce3ec] bg-white px-3 text-[11px] text-[#26324b] shadow-none placeholder:text-[#9aa7bd] focus-visible:ring-1 focus-visible:ring-emerald-600"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[15px] font-medium text-[#64708b]">
                Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    className="h-[35px] rounded-[5px] border-[#dce3ec] bg-white px-3 pr-9 text-[11px] text-[#26324b] shadow-none placeholder:text-[#9aa7bd] focus-visible:ring-1 focus-visible:ring-emerald-600"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7c8aa3] transition-colors hover:text-emerald-700"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }>
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between gap-3">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-3.5 w-3.5 rounded border-[#dce3ec] accent-[#2f8f5c]"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-[11px] font-medium text-[#64708b]">
                  Ingat saya
                </FormLabel>
              </FormItem>
            )}
          />
          <Link
            to="/forgot-password"
            className="text-[11px] font-medium text-[#64708b] hover:text-emerald-700"
          >
            Lupa kata sandi?
          </Link>
        </div>

        <Button
          type="submit"
          className="mt-5 h-[29px] w-full rounded-[5px] bg-[#2f8f5c] text-[10px] font-bold uppercase tracking-wide text-white shadow-none transition-colors hover:bg-[#27794d]"
          disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Memproses...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}
