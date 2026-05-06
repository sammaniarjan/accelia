import { NewProjectForm } from './new-project-form';

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Nieuw project</h1>
      <p className="mt-1 text-sm text-slate-500">
        Maak een dossier aan voor één geneesmiddel-indicatie combinatie.
      </p>
      <div className="mt-6 max-w-xl">
        <NewProjectForm />
      </div>
    </div>
  );
}
