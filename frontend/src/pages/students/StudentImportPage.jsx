import { useRef, useState } from "react";
import { Upload, FileText, X, Download, CheckCircle, AlertCircle } from "lucide-react";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function StudentImportPage() {
    const inputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const formatSize = (bytes) => {
        if (!bytes) return "0 KB";

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }

        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    const openFilePicker = () => {
        inputRef.current?.click();
    };

    const handleSelect = (e) => {
        const selected = e.target.files[0];

        if (!selected) return;

        if (!selected.name.endsWith(".csv")) {
            setError("Lejohet vetëm skedar CSV.");
            return;
        }

        setError("");
        setSuccess("");
        setFile(selected);
    };

    const handleDrop = (e) => {
        e.preventDefault();

        setDragging(false);

        const selected = e.dataTransfer.files[0];

        if (!selected) return;

        if (!selected.name.endsWith(".csv")) {
            setError("Lejohet vetëm skedar CSV.");
            return;
        }

        setError("");
        setSuccess("");
        setFile(selected);
    };

    const removeFile = () => {
        setFile(null);

        setSuccess("");
        setError("");

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const downloadTemplate = () => {
        const csv =
            `first_name,last_name,class_id,type,status
Ahmed,Hoxha,1,Regular,Active
Fatima,Krasniqi,1,Boarding,Active`;

        const blob = new Blob([csv], {
            type: "text/csv",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = "students-template.csv";

        a.click();

        URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        if (!file) {
            setError("Ju lutem zgjidhni një skedar CSV.");
            return;
        }

        try {
            setLoading(true);

            setError("");
            setSuccess("");

            const res = await api.students.import(file);

            setSuccess(
                `${res.data.imported} nxënës u importuan me sukses.`
            );

            removeFile();
        } catch (err) {
            console.error(err);

            setError(
                err?.message ||
                "Ndodhi një gabim gjatë importimit të nxënësve."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Import masiv"
                description="Importo nxënës nga CSV"
            />

            <Card className="max-w-3xl">
                <CardContent className="space-y-6">

                    <div className="flex justify-end">

                        <Button
                            variant="secondary"
                            onClick={downloadTemplate}
                        >
                            <Download className="mr-2 h-4 w-4" />

                            Shkarko shabllonin

                        </Button>

                    </div>

                    <div
                        onClick={openFilePicker}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`
              cursor-pointer
              rounded-2xl
              border-2
              border-dashed
              p-12
              transition-all
              text-center

              ${dragging
                                ? "border-brand-500 bg-brand-500/10"
                                : "border-white/10 hover:border-brand-500"
                            }
            `}
                    >
                        <Upload className="mx-auto h-14 w-14 text-brand-500" />

                        <h2 className="mt-4 text-lg font-semibold">
                            Zvarrite & lësho skedarin CSV
                        </h2>

                        <p className="mt-2 text-sm text-surface-400">
                            ose klikoni këtu për ta zgjedhur
                        </p>


                        <input
                            ref={inputRef}
                            hidden
                            type="file"
                            accept=".csv"
                            onChange={handleSelect}
                        />
                    </div>

                    {file && (
                        <div className="rounded-xl border border-white/10 bg-surface-900 p-4 flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <FileText className="text-brand-500" />

                                <div>

                                    <p className="font-medium">
                                        {file.name}
                                    </p>

                                    <p className="text-xs text-surface-500">
                                        {formatSize(file.size)}
                                    </p>

                                </div>

                            </div>

                            <Button
                                variant="ghost"
                                onClick={removeFile}
                            >
                                <X className="h-4 w-4" />
                            </Button>

                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-3">

                            <div className="flex items-center gap-3">

                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />

                                <span className="text-sm text-surface-300">
                                    Importimi i nxënësve...
                                </span>

                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-surface-800">
                                <div className="h-full w-full animate-pulse rounded-full bg-brand-500" />
                            </div>

                        </div>
                    )}

                    <div className="flex justify-end gap-3">

                        <Button
                            variant="secondary"
                            disabled={loading}
                            onClick={removeFile}
                        >
                            Pastro
                        </Button>

                        <Button
                            disabled={!file || loading}
                            onClick={handleImport}
                        >
                            {loading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Importimi...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importo nxënës
                                </>
                            )}
                        </Button>

                    </div>

                </CardContent>
            </Card>
        </div>
    );
}