import logo from '@/assets/logo.png'

export default function Logo() {
    return (
        <div className="mx-auto mb-4 flex h-30 w-100 items-center justify-center rounded-xl ">
            <img src={logo} alt="Logo" className="h-33 w-50" />
            <div className=" text-left w-full">

                <h1 className="font-display text-4xl text-surface-50">
                    MEDRESEJA <span className=" text-brand-400" bold='true' >ALAUDDIN</span>
                </h1>
                <p className="mt- text-sm text-surface-300">
                    School Management System
                </p>
            </div>
        </div>)
}