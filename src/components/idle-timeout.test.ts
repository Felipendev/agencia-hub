// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
const mocks=vi.hoisted(()=>({logout:vi.fn(),replace:vi.fn()}));
vi.mock("@/contexts/auth-context",()=>({useAuth:()=>({user:{id:"owner"},logout:mocks.logout})}));
vi.mock("next/navigation",()=>({useRouter:()=>({replace:mocks.replace})}));
import { IdleTimeout } from "./idle-timeout";
afterEach(()=>{cleanup();vi.useRealTimers();vi.clearAllMocks();});
it("mantém sessão por horas e renova o prazo ao voltar",()=>{
  vi.useFakeTimers();render(React.createElement(IdleTimeout));
  act(()=>vi.advanceTimersByTime(60*60*1000));
  expect(mocks.logout).not.toHaveBeenCalled();
  fireEvent.click(document);
  act(()=>vi.advanceTimersByTime(7*60*60*1000+54*60*1000));
  expect(mocks.logout).not.toHaveBeenCalled();
  act(()=>vi.advanceTimersByTime(60*1000));
  expect(screen.getByRole("dialog")).toBeTruthy();
  act(()=>vi.advanceTimersByTime(5*60*1000));
  expect(mocks.logout).toHaveBeenCalledOnce();
});
