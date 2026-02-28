import { describe, it, expect } from "vitest";
import { fmtS, fmtN } from "../utils";

describe("fmtS — formato moneda soles", () => {
  it("formatea numero positivo", () => {
    expect(fmtS(1500)).toMatch(/S\/\.\s*1[.,]500/);
  });

  it("formatea cero", () => {
    expect(fmtS(0)).toMatch(/S\/\.\s*0/);
  });

  it("retorna '-' para undefined", () => {
    expect(fmtS(undefined)).toBe("-");
  });

  it("formatea decimales sin centavos (0 fraction digits)", () => {
    const result = fmtS(1234.56);
    // fmtS usa minimumFractionDigits: 0, maximumFractionDigits: 0
    // asi que redondea al entero
    expect(result).toMatch(/S\/\.\s*1[.,]235/);
  });

  it("formatea numeros negativos", () => {
    const result = fmtS(-500);
    expect(result).toContain("500");
  });
});

describe("fmtN — formato numerico", () => {
  it("formatea con 2 decimales por defecto", () => {
    expect(fmtN(3.14159)).toBe("3.14");
  });

  it("formatea con decimales custom", () => {
    expect(fmtN(3.14159, 4)).toBe("3.1416");
  });

  it("formatea cero", () => {
    expect(fmtN(0)).toBe("0.00");
  });

  it("retorna '-' para undefined", () => {
    expect(fmtN(undefined)).toBe("-");
  });

  it("formatea entero con decimales", () => {
    expect(fmtN(5, 3)).toBe("5.000");
  });

  it("formatea sin decimales", () => {
    expect(fmtN(42, 0)).toBe("42");
  });
});
