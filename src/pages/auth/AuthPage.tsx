import { cn } from '@/lib/utils'
import UserAuthForm from '@/components/layouts/auth/UserAuthForm'
import { FileCheck2 } from 'lucide-react'

export default function SignIn() {
    return (
        <>
            <div className='relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
                <div className='lg:p-8'>
                    <div className='mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-[480px] sm:p-8'>
                        <div className='mb-4 flex items-center justify-center'>
                            <div className='flex items-center justify-center rounded-lg bg-primary text-primary-foreground p-2 me-3'>
                                <FileCheck2 className='size-6' />
                            </div>
                            <h1 className='text-xl font-semibold'>Agreema</h1>
                        </div>
                    </div>
                    <div className='mx-auto flex w-full max-w-sm flex-col justify-center space-y-2'>
                        <div className='flex flex-col space-y-2 text-start'>
                            <h2 className='text-lg font-semibold tracking-tight'>Masuk ke Akun</h2>
                            <p className='text-sm text-muted-foreground'>
                                Masukkan email dan password Anda <br />
                                untuk mengakses sistem
                            </p>
                        </div>
                        <UserAuthForm />
                        <p className='px-8 text-center text-sm text-muted-foreground'>
                            Dengan masuk, Anda menyetujui{' '}
                            <a
                                href='/terms'
                                className='underline underline-offset-4 hover:text-primary'
                            >
                                Syarat Layanan
                            </a>{' '}
                            dan{' '}
                            <a
                                href='/privacy'
                                className='underline underline-offset-4 hover:text-primary'
                            >
                                Kebijakan Privasi
                            </a>
                            .
                        </p>
                    </div>
                </div>

                <div
                    className={cn(
                        'relative h-full overflow-hidden bg-muted max-lg:hidden',
                        'flex items-center justify-center'
                    )}
                >
                    <div className='text-center p-8'>
                        <div className='flex items-center justify-center mb-6'>
                            <div className='flex items-center justify-center rounded-2xl bg-primary text-primary-foreground p-4'>
                                <FileCheck2 className='size-16' />
                            </div>
                        </div>
                        <h2 className='text-3xl font-bold mb-2'>Agreema</h2>
                        <p className='text-xl text-muted-foreground mb-4'>Digital Contract Lifecycle Management</p>
                        <p className='text-sm text-muted-foreground max-w-md'>
                            Platform internal untuk mengelola seluruh siklus kontrak perusahaan —
                            dari pembuatan, persetujuan, hingga tanda tangan digital.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}