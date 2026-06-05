use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    // General errors (100–199)
    Unauthorized = 100,
    NotFound = 101,
    AlreadyExists = 102,
    InvalidInput = 103,
    InternalError = 104,
    NotAllowed = 105,
    Expired = 106,

    // ProductRegistry errors (200–299)
    ProductNotFound = 200,
    ProductAlreadyExists = 201,
    ProductNotActive = 202,
    TransferNotAllowed = 203,
    InvalidProductMetadata = 204,
    ProductNotOwned = 205,

    // LifecycleTracker errors (300–399)
    EventNotFound = 300,
    InvalidEventData = 301,
    StageMismatch = 302,
    EmissionsNotComputed = 303,
    BatchPartialFailure = 304,

    // Attestation errors (400–499)
    AttestationNotFound = 400,
    AttestationNotPending = 401,
    AlreadyVoted = 402,
    InsufficientVerifiers = 403,
    QuorumNotReached = 404,
    AttestationAlreadyFinalized = 405,

    // Certificate / Verifier errors (500–599)
    CertificateNotFound = 500,
    CertificateAlreadyRevoked = 501,
    InvalidCertificateData = 502,
    VerifierNotFound = 503,
    VerifierAlreadyRegistered = 504,
    VerifierNotActive = 505,
    InsufficientStake = 506,
    StakeLocked = 507,
    ReputationTooLow = 508,
}
