"use client";

import { NovoClienteModal } from "./NovoClienteModal";
import type { Cliente } from "@/types";

/** Creation and editing share all fields, options and normalization. */
export function EditarClienteModal({ cliente, open, onClose }: {
  cliente: Cliente;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <NovoClienteModal key={cliente.id} cliente={cliente} open onClose={onClose} onCreated={() => {}} />;
}
