import { describe, it, expect } from "vitest";
import { escapeCSV } from "../export-budget";

describe("escapeCSV", () => {
  describe("valores normales", () => {
    it("retorna string simple sin cambios", () => {
      expect(escapeCSV("Concreto f'c=210")).toBe("Concreto f'c=210");
    });

    it("retorna string vacio sin cambios", () => {
      expect(escapeCSV("")).toBe("");
    });

    it("retorna numeros como string sin cambios", () => {
      expect(escapeCSV("123.45")).toBe("123.45");
    });
  });

  describe("caracteres especiales CSV", () => {
    it("escapa comas con comillas dobles", () => {
      expect(escapeCSV("Acero 3/4, 1/2")).toBe('"Acero 3/4, 1/2"');
    });

    it("escapa comillas dobles duplicandolas", () => {
      expect(escapeCSV('Varilla "corrugada"')).toBe('"Varilla ""corrugada"""');
    });

    it("escapa saltos de linea", () => {
      expect(escapeCSV("Linea1\nLinea2")).toBe('"Linea1\nLinea2"');
    });

    it("escapa retorno de carro", () => {
      // \r in middle → no prefix, but triggers CSV quoting
      expect(escapeCSV("Linea1\rLinea2")).toBe('"Linea1\rLinea2"');
    });
  });

  describe("formula injection protection", () => {
    it("prefija = con apostrofe", () => {
      expect(escapeCSV("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    });

    it("prefija + con apostrofe", () => {
      expect(escapeCSV("+cmd|'/c calc'!A1")).toBe("'+cmd|'/c calc'!A1");
    });

    it("prefija - con apostrofe", () => {
      expect(escapeCSV("-1+1")).toBe("'-1+1");
    });

    it("prefija @ con apostrofe", () => {
      expect(escapeCSV("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
    });

    it("prefija tab con apostrofe", () => {
      expect(escapeCSV("\tcmd")).toBe("'\tcmd");
    });

    it("prefija \\r con apostrofe y luego escapa \\r", () => {
      // starts with \r → prefix with ', then \r triggers CSV quoting
      expect(escapeCSV("\rcmd")).toBe("\"'\rcmd\"");
    });

    it("formula con coma se escapa doblemente", () => {
      const result = escapeCSV("=1+1,test");
      expect(result.startsWith('"')).toBe(true);
      expect(result).toContain("'=1+1");
    });
  });

  describe("combinaciones", () => {
    it("coma + comilla doble", () => {
      const result = escapeCSV('Desc "A", tipo B');
      expect(result).toBe('"Desc ""A"", tipo B"');
    });

    it("formula + coma + salto de linea", () => {
      const result = escapeCSV("=SUM,\ntest");
      expect(result.startsWith('"')).toBe(true);
      expect(result).toContain("'=SUM");
    });
  });
});
