import { UploadForm } from './upload-form';

export default function UploadPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Pakketadvies uploaden</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload een ZIN pakketadvies (PDF). Het document wordt geparsed, geëxtraheerd door Claude
        Haiku en in de kennisbank opgeslagen na jouw review.
      </p>
      <div className="mt-6">
        <UploadForm />
      </div>
    </div>
  );
}
