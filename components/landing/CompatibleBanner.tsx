"use client";

export function CompatibleBanner() {
  const handleClick = () => {
    // Dispara evento global que escucha ModalExplorador
    window.dispatchEvent(new CustomEvent("abrir-explorador"));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="Explorar modelos 3D - abre el explorador de diseños"
      className="group relative w-full cursor-pointer overflow-hidden border-y border-neutral-800 bg-neutral-950 py-4 transition-all duration-300 hover:bg-neutral-900 hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] text-left"
    >
      <div className="flex items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Estado normal: Logos */}
        <div className="flex items-center gap-8 opacity-100 transition-opacity duration-300 group-hover:opacity-0 md:group-hover:opacity-20 text-neutral-500">
          <span className="text-sm font-bold tracking-widest">COMPATIBLE CON</span>
          <span className="hidden sm:inline">MakerWorld</span>
          <span className="hidden sm:inline text-neutral-700">•</span>
          <span className="hidden sm:inline">Thingiverse</span>
          <span className="hidden sm:inline text-neutral-700">•</span>
          <span className="hidden sm:inline">Printables</span>
          <span className="hidden sm:inline text-neutral-700">•</span>
          <span className="hidden md:inline">Cults3D</span>
          {/* En móvil mostrar solo 2 para no saturar, el hover CTA tomará protagonismo */}
          <span className="sm:hidden text-xs">MakerWorld • Thingiverse • +2</span>
        </div>

        {/* Info adicional visible en desktop estado normal - se atenúa en hover */}
        <span className="hidden lg:inline text-xs text-neutral-600 transition-opacity duration-300 group-hover:opacity-0 md:group-hover:opacity-20 shrink-0">
          +1.200 piezas entregadas
        </span>

        {/* Estado Hover: Llamada a la acción superpuesta */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 px-6">
          <span className="text-orange-500 font-semibold flex items-center gap-2 text-sm md:text-base text-center">
            ¿No sabes qué imprimir? Explora millones de diseños gratuitos aquí 🚀
          </span>
        </div>
      </div>
    </button>
  );
}

export default CompatibleBanner;
