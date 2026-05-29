class Docente {
    constructor(id, cognome, nome, email, ore_contratto, tipo_contratto, ore_altro) {
        this.id = id;
        this.cognome = cognome;
        this.nome = nome;
        this.email = email;
        this.ore_contratto = ore_contratto;
        this.tipo_contratto = tipo_contratto;
        this.ore_altro = ore_altro;
    }

    get nomeCompleto() {
        return `${this.cognome} ${this.nome}`;
    }

    get oreTotali() {
        return this.ore_contratto + this.ore_altro;
    }
} module.exports = Docente;