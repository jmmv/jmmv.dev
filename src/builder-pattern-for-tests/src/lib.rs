#[cfg(test)] mod tests;

/// Sums all input `values` and returns the total.
pub fn sum_all(values: &[i32]) -> i32 {
    let mut result = 0;
    for v in values {
        result += v;
    }
    result
}
