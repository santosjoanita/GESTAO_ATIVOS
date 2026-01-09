
export function useAuth() {
  const userRaw = localStorage.getItem('user');
  
  if (!userRaw) {
    return {
      user: null,
      isAuthenticated: false,
    };
  }

  try {
    const user = JSON.parse(userRaw);

    return {
      user,
      isAuthenticated: !!user,
    };
  } catch (error) {
    console.error("Erro ao ler utilizador do localStorage:", error);
    return { user: null, isAuthenticated: false };
  }
}