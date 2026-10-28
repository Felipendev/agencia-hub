"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  walletFields,
  walletLabels,
  type WalletData,
} from "@/lib/miles-wallet";
import type { DiagnosticData } from "@/lib/miles-diagnostics";
export function DiagnosticFields({
  value,
  onChange,
  internal = false,
}: {
  value: DiagnosticData;
  onChange: (value: DiagnosticData) => void;
  internal?: boolean;
}) {
  const profileFields = [
    ["goals", "Objetivos"],
    ["travelFrequency", "Frequência de viagens"],
    ["destinations", "Destinos de interesse"],
    ...(internal ? [["actionPlan", "Plano de ações da agência"]] : []),
  ] as const;
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--hub-text-muted)]">
        Informe somente declarações. Não envie senhas de programas nem números
        completos de cartões. Os dados serão conferidos pela agência.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {(
          [
            ["name", "Nome", 200, "text"],
            ["email", "E-mail", 254, "email"],
            ["phone", "Telefone com código do país", 30, "tel"],
          ] as const
        ).map(([key, label, maxLength, type]) => (
          <label key={key} className="space-y-1 text-sm">
            {label}
            <Input
              type={type}
              required={key !== "phone"}
              maxLength={maxLength}
              placeholder={key === "phone" ? "Ex.: +351 912345678" : undefined}
              value={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      {profileFields.map(([key, label]) => (
        <label key={key} className="block space-y-1 text-sm">
          {label}
          <textarea
            className="block min-h-20 w-full rounded-lg border border-[var(--hub-border)] p-2"
            maxLength={
              key === "travelFrequency"
                ? 200
                : key === "actionPlan"
                  ? 4000
                  : 2000
            }
            value={value.profile[key as keyof typeof value.profile]}
            onChange={(e) =>
              onChange({
                ...value,
                profile: { ...value.profile, [key]: e.target.value },
              })
            }
          />
        </label>
      ))}
      <div>
        <h3 className="font-semibold">Contas, cartões e clubes declarados</h3>
        <p className="text-sm text-[var(--hub-text-muted)]">
          Opcional, até 20 registros. Saldo precisa de titular, fonte e data;
          não é consultado nos programas. Vencimentos são cadastrados pela
          agência após conferir a conta.
        </p>
      </div>
      {value.items.map((item, index) => (
        <fieldset
          key={index}
          className="space-y-3 rounded-lg border border-[var(--hub-border)] p-3"
        >
          <legend className="px-1 text-sm font-medium">
            {walletLabels[item.kind]} · registro {index + 1}
          </legend>
          <div className="grid gap-3 md:grid-cols-2">
            {walletFields[item.kind].map((field) => (
              <label className="space-y-1 text-sm" key={field.key}>
                {field.label}
                <Input
                  aria-label={`${field.label} · registro ${index + 1}`}
                  type={field.type ?? "text"}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  maxLength={field.maxLength}
                  value={String(item.data[field.key] ?? "")}
                  onChange={(e) => {
                    const data: WalletData = {
                      ...item.data,
                      [field.key]:
                        field.type === "number"
                          ? e.target.value === ""
                            ? null
                            : Number(e.target.value)
                          : e.target.value,
                    };
                    onChange({
                      ...value,
                      items: value.items.map((v, i) =>
                        i === index ? { ...v, data } : v,
                      ),
                    });
                  }}
                />
              </label>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              onChange({
                ...value,
                items: value.items.filter((_, i) => i !== index),
              })
            }
          >
            Remover registro {index + 1}
          </Button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ACCOUNT", "Adicionar conta"],
            ["CARD", "Adicionar cartão"],
            ["CLUB", "Adicionar clube"],
          ] as const
        ).map(([kind, label]) => (
          <Button
            key={kind}
            variant="secondary"
            disabled={value.items.length >= 20}
            onClick={() =>
              onChange({
                ...value,
                items: [...value.items, { kind, data: {} }],
              })
            }
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
export function DiagnosticRead({
  data,
  showProfile = true,
  showContact = true,
}: {
  data: DiagnosticData;
  showProfile?: boolean;
  showContact?: boolean;
}) {
  return (
    <div className="space-y-3 text-sm break-words">
      {showContact && (
        <p>
          {data.name} · {data.email} {data.phone && `· ${data.phone}`}
        </p>
      )}
      {showProfile && (
        <dl className="grid gap-2 md:grid-cols-2">
          {Object.entries({
            Objetivos: data.profile.goals,
            Frequência: data.profile.travelFrequency,
            Destinos: data.profile.destinations,
            "Plano de ações": data.profile.actionPlan,
          }).map(([key, value]) => (
            <div key={key}>
              <dt className="text-[var(--hub-text-muted)]">{key}</dt>
              <dd className="whitespace-pre-wrap">
                {value || "Não informado"}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {data.items.map((item, index) => (
        <div key={index} className="border-t pt-2">
          <h4 className="font-medium">
            {walletLabels[item.kind]} · registro {index + 1}
          </h4>
          <dl className="grid gap-1 md:grid-cols-2">
            {walletFields[item.kind].map((field) => (
              <div key={field.key}>
                <dt className="text-[var(--hub-text-muted)]">{field.label}</dt>
                <dd>{String(item.data[field.key] ?? "Não informado")}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
