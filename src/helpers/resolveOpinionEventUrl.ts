import urlcat from 'urlcat';

export function resolveOpinionEventUrl(topicId: number, isMulti: boolean) {
    return urlcat('https://app.opinion.trade/detail', {
        topicId,
        type: isMulti ? 'multi' : 'single',
    });
}
