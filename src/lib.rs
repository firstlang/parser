//! Open-source recursive descent parser for the First programming language.
//!
//! This crate is currently a scaffold. The parser will be derived from the
//! language's internal abstract regular expression parser, which remains the
//! source of truth for tokens and grammar structure.

/// Current maturity level of this crate.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ParserStatus {
    /// The repository has been created, but the parser is not implemented yet.
    Scaffold,
}

/// Returns the current parser implementation status.
pub const fn status() -> ParserStatus {
    ParserStatus::Scaffold
}

#[cfg(test)]
mod tests {
    use super::{status, ParserStatus};

    #[test]
    fn reports_scaffold_status() {
        assert_eq!(status(), ParserStatus::Scaffold);
    }
}
