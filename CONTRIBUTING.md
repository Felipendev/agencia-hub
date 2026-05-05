# Contributing to AgenciaHub

Obrigado por considerar contribuir com o AgenciaHub! 🎉

## 📋 Código de Conduta

- Seja respeitoso e profissional
- Aceite feedback construtivo
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 🚀 Como Contribuir

### Reportar Bugs

1. Verifique se o bug já foi reportado nas [Issues](../../issues)
2. Se não, crie uma nova issue com:
   - Título claro e descritivo
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Ambiente (OS, browser, versões)

### Sugerir Features

1. Verifique se a feature já foi sugerida
2. Crie uma issue com:
   - Descrição clara da feature
   - Motivação e casos de uso
   - Exemplos de implementação (se possível)

### Pull Requests

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Crie uma branch** para sua feature/fix:
   ```bash
   git checkout -b feature/minha-feature
   # ou
   git checkout -b fix/meu-bug
   ```
4. **Faça suas mudanças** seguindo os padrões do projeto
5. **Commit** com mensagens claras:
   ```bash
   git commit -m "feat: adiciona busca global"
   git commit -m "fix: corrige validação de email"
   ```
6. **Push** para seu fork:
   ```bash
   git push origin feature/minha-feature
   ```
7. **Abra um Pull Request** no repositório original

## 📝 Padrões de Código

### Frontend (Next.js/TypeScript)

- Use TypeScript estrito
- Siga as convenções do ESLint
- Componentes em PascalCase
- Funções/variáveis em camelCase
- Use Tailwind CSS para estilos
- Prefira componentes funcionais com hooks

**Exemplo**:
```typescript
export function MeuComponente({ prop }: MeuComponenteProps) {
  const [estado, setEstado] = useState<string>("");
  
  return (
    <div className="flex items-center gap-4">
      {/* conteúdo */}
    </div>
  );
}
```

### Backend (Spring Boot/Java)

- Use Java 17+
- Siga convenções do Spring Boot
- Classes em PascalCase
- Métodos/variáveis em camelCase
- Use Lombok para reduzir boilerplate
- Documente endpoints com OpenAPI

**Exemplo**:
```java
@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {
    
    private final CustomerService customerService;
    
    @GetMapping
    @Operation(summary = "List customers")
    public List<CustomerResponse> list() {
        return customerService.findAll();
    }
}
```

## 🧪 Testes

### Frontend
```bash
# Rodar testes (quando implementados)
npm test

# Verificar tipos
npm run type-check

# Lint
npm run lint
```

### Backend
```bash
# Testes unitários
mvn test

# Testes de integração
mvn verify

# Cobertura
mvn test jacoco:report
```

## 📦 Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova feature
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto e vírgula, etc
- `refactor:` Refatoração de código
- `test:` Adicionar/modificar testes
- `chore:` Tarefas de build, configs, etc

**Exemplos**:
```bash
feat: adiciona filtro de data nas cotações
fix: corrige cálculo de total na cotação
docs: atualiza README com instruções de deploy
refactor: extrai lógica de validação para service
test: adiciona testes para CustomerService
chore: atualiza dependências do Spring Boot
```

## 🔄 Processo de Review

1. Pelo menos 1 aprovação necessária
2. CI deve passar (quando implementado)
3. Código deve seguir os padrões
4. Testes devem estar incluídos
5. Documentação deve ser atualizada

## 🌳 Branches

- `main` - Código em produção (protegida)
- `develop` - Desenvolvimento ativo (futuro)
- `feature/*` - Novas features
- `fix/*` - Correções de bugs
- `hotfix/*` - Correções urgentes

## 📚 Documentação

Ao adicionar features, atualize:

- `README.md` - Se muda uso básico
- `API_CONTRACT.md` - Se adiciona/modifica endpoints
- `ESTRATEGIA_DESENVOLVIMENTO.md` - Se muda arquitetura
- Comentários no código - Para lógica complexa
- OpenAPI/Swagger - Para novos endpoints

## 🎯 Prioridades Atuais

Veja `ESTRATEGIA_DESENVOLVIMENTO.md` para:
- Sprints planejadas
- Features prioritárias
- Gaps conhecidos

## ❓ Dúvidas

- Abra uma [Discussion](../../discussions)
- Ou crie uma issue com label `question`

## 🙏 Agradecimentos

Toda contribuição é valiosa, seja código, documentação, testes ou feedback!

---

**Happy Coding!** 🚀
