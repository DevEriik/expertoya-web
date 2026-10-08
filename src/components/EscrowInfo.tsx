import { ShieldCheck, Lock, Wallet } from "lucide-react";

export const EscrowInfo = () => {
  return (
    <section className="px-4 py-12 md:py-16 max-w-5xl mx-auto w-full">
      <div className="bg-secondary/10 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 border border-secondary/20">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-secondary text-sm font-bold mb-6 shadow-sm">
            <ShieldCheck size={16} />
            <span>Pagos 100% Seguros</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-dark mb-4 leading-tight">
            Tu dinero está protegido hasta que el trabajo esté terminado
          </h2>
          <p className="text-dark/70 text-lg mb-8">
            Con nuestro sistema de <strong>Retención Segura (Escrow)</strong>,
            tu pago se guarda de forma neutral. El profesional solo recibe el
            dinero cuando tú confirmas que el trabajo se realizó correctamente.
          </p>

          <ul className="space-y-4">
            <li className="flex items-center gap-4 text-dark font-bold">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                <Wallet size={20} />
              </div>
              Pagas al contratar, pero el dinero se retiene.
            </li>
            <li className="flex items-center gap-4 text-dark font-bold">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-success shadow-sm">
                <ShieldCheck size={20} />
              </div>
              Garantía de satisfacción o devolución garantizada.
            </li>
          </ul>
        </div>
        <div className="w-full md:w-72 bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col items-center text-center shrink-0 transition-transform hover:-translate-y-1">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mb-6">
            <Lock size={40} />
          </div>
          <h3 className="font-extrabold text-xl text-dark mb-2">
            Fondos Retenidos
          </h3>
          <p className="text-dark/60 font-medium">
            El pago se libera al profesional{" "}
            <span className="text-success font-bold">
              solo con tu aprobación
            </span>{" "}
            final.
          </p>
        </div>
      </div>
    </section>
  );
};
