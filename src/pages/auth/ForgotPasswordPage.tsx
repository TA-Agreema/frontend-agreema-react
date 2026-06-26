import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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
import { requestPasswordReset } from "@/services/auth.service";

const formSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await requestPasswordReset(data.email);
      setMessage(response.message);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Gagal mengirim email reset password. Silakan coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      <section className="relative flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14">
        <div className="flex items-start gap-2.5">
          <img
            src="/Agreema.svg"
            alt="Agreema"
            className="h-11 w-auto object-contain"
          />
        </div>

        <div className="mx-auto flex w-full max-w-[320px] flex-1 flex-col justify-center pb-12">
          <h1 className="mb-3 text-[22px] font-extrabold leading-none text-[#202638]">
            Lupa Password
          </h1>
          <p className="mb-7 text-xs leading-relaxed text-[#64708b]">
            Masukkan email akun Anda. Sistem akan mengirimkan tautan untuk
            membuat password baru.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {message && (
                <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
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

              <Button
                type="submit"
                className="mt-5 h-[29px] w-full rounded-[5px] bg-[#2f8f5c] text-[10px] font-bold uppercase tracking-wide text-white shadow-none transition-colors hover:bg-[#27794d]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Link Reset"
                )}
              </Button>
            </form>
          </Form>

          <Link
            to="/login"
            className="mt-4 text-center text-xs font-medium text-[#64708b] hover:text-emerald-700"
          >
            Kembali ke halaman login
          </Link>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src="/imageLogin.png"
          alt="Ruang kerja Agreema"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-700/78" />
        <div className="relative z-10 flex h-full items-center justify-center px-18 text-center text-white">
          <div className="max-w-[560px]">
            <h2 className="whitespace-nowrap text-[40px] font-extrabold leading-tight">
              Halo, Selamat Datang!
            </h2>
            <p className="mx-auto mt-3 max-w-[390px] text-[18px] font-medium leading-relaxed text-white/90">
              Kelola, pantau, dan amankan seluruh kontrak dalam satu platform
              terintegrasi.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
